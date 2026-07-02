using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using System.Collections;
using System.Linq.Expressions;

namespace Application.UnitTests.Features.Dashboard;

public class GetAdminDashboardStatsQueryHandlerTests
{
    private readonly Mock<IPitchRepository> _pitchRepoMock = new();
    private readonly Mock<IApplicationDbContext> _contextMock = new();

    [Fact]
    public async Task Handle_WithUsers_ReturnsCorrectStats()
    {
        // Arrange
        _pitchRepoMock.Setup(r => r.GetPagedAsync(1, 1, null, PitchStatus.PendingApproval, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PagedResult<Pitch>.Empty());
        _contextMock.Setup(c => c.Users)
            .Returns(CreateAsyncDbSet(Array.Empty<User>()));
        _contextMock.Setup(c => c.Pitches)
            .Returns(CreateAsyncDbSet(Array.Empty<Pitch>()));
        _contextMock.Setup(c => c.Bookings)
            .Returns(CreateAsyncDbSet(Array.Empty<Booking>()));
        _contextMock.Setup(c => c.SportCenters)
            .Returns(CreateAsyncDbSet(Array.Empty<SportCenter>()));

        var handler = new GetAdminDashboardStatsQueryHandler(
            _pitchRepoMock.Object, _contextMock.Object);

        // Act
        var result = await handler.Handle(new GetAdminDashboardStatsQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.TotalUsers.Should().Be(0);
        result.Value.PendingApprovals.Should().Be(0);
    }

    private static DbSet<T> CreateAsyncDbSet<T>(IEnumerable<T> items) where T : class
    {
        var queryable = items.AsQueryable();
        var dbSet = new Mock<DbSet<T>>();
        dbSet.As<IAsyncEnumerable<T>>()
            .Setup(set => set.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<T>(queryable.GetEnumerator()));
        dbSet.As<IQueryable<T>>().Setup(set => set.Provider)
            .Returns(new TestAsyncQueryProvider<T>(queryable.Provider));
        dbSet.As<IQueryable<T>>().Setup(set => set.Expression).Returns(queryable.Expression);
        dbSet.As<IQueryable<T>>().Setup(set => set.ElementType).Returns(queryable.ElementType);
        dbSet.As<IQueryable<T>>().Setup(set => set.GetEnumerator()).Returns(() => queryable.GetEnumerator());
        return dbSet.Object;
    }
}

internal sealed class TestAsyncQueryProvider<TEntity> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    public TestAsyncQueryProvider(IQueryProvider inner) => _inner = inner;

    public IQueryable CreateQuery(Expression expression) => new TestAsyncEnumerable<TEntity>(expression);
    public IQueryable<TElement> CreateQuery<TElement>(Expression expression) => new TestAsyncEnumerable<TElement>(expression);
    public object? Execute(Expression expression) => _inner.Execute(expression);
    public TResult Execute<TResult>(Expression expression) => _inner.Execute<TResult>(expression);
    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var resultType = typeof(TResult).GetGenericArguments()[0];
        var executionResult = typeof(IQueryProvider)
            .GetMethod(nameof(IQueryProvider.Execute), 1, new[] { typeof(Expression) })!
            .MakeGenericMethod(resultType)
            .Invoke(_inner, new object[] { expression });
        return (TResult)typeof(Task)
            .GetMethod(nameof(Task.FromResult))!
            .MakeGenericMethod(resultType)
            .Invoke(null, new[] { executionResult })!;
    }
}

internal sealed class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public TestAsyncEnumerable(IEnumerable<T> enumerable) : base(enumerable) { }
    public TestAsyncEnumerable(Expression expression) : base(expression) { }
    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default) =>
        new TestAsyncEnumerator<T>(((IEnumerable<T>)this).GetEnumerator());
    IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
}

internal sealed class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;
    public TestAsyncEnumerator(IEnumerator<T> inner) => _inner = inner;
    public T Current => _inner.Current;
    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }
    public ValueTask<bool> MoveNextAsync() => ValueTask.FromResult(_inner.MoveNext());
}

public class GetOwnerDashboardStatsQueryHandlerTests
{
    private readonly Mock<IBookingRepository> _bookingRepoMock = new();
    private readonly Mock<IPitchRepository> _pitchRepoMock = new();

    [Fact]
    public async Task Handle_NoPitches_ReturnsEmptyStats()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        _pitchRepoMock.Setup(r => r.GetByOwnerIdAsync(ownerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Pitch>());

        var handler = new GetOwnerDashboardStatsQueryHandler(
            _bookingRepoMock.Object, _pitchRepoMock.Object);

        // Act
        var result = await handler.Handle(new GetOwnerDashboardStatsQuery(ownerId), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.TotalRevenue.Should().Be(0);
        result.Value.TotalBookings.Should().Be(0);
    }
}

public class SuspendUserCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IApplicationDbContext> _contextMock = new();

    [Fact]
    public async Task Handle_UserNotFound_ReturnsFailure()
    {
        // Arrange
        _userRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var handler = new SuspendUserCommandHandler(_userRepoMock.Object, _contextMock.Object);

        // Act
        var result = await handler.Handle(new SuspendUserCommand(Guid.NewGuid()), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Không tìm thấy");
    }
}
