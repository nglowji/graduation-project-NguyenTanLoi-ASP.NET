using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using FluentAssertions;
using Moq;

namespace Application.UnitTests.Features.Dashboard;

public class GetAdminDashboardStatsQueryHandlerTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IBookingRepository> _bookingRepoMock = new();
    private readonly Mock<IPitchRepository> _pitchRepoMock = new();

    [Fact]
    public async Task Handle_WithUsers_ReturnsCorrectStats()
    {
        // Arrange
        var users = new List<User>();
        _userRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);
        _bookingRepoMock.Setup(r => r.GetAllByDateRangeAsync(It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking>());
        _pitchRepoMock.Setup(r => r.GetPagedAsync(1, 1, null, PitchStatus.PendingApproval, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PagedResult<Pitch>.Empty());

        var handler = new GetAdminDashboardStatsQueryHandler(
            _userRepoMock.Object, _bookingRepoMock.Object, _pitchRepoMock.Object);

        // Act
        var result = await handler.Handle(new GetAdminDashboardStatsQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.TotalUsers.Should().Be(0);
        result.Value.PendingApprovals.Should().Be(0);
    }
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
