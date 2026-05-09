using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Bookings.Commands.CreateBooking;
using Domain.Entities;
using Domain.Services;
using Domain.ValueObjects;
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Moq;

namespace Application.UnitTests.Features.Bookings;

/// <summary>
/// Unit tests for CreateBookingCommandHandler validation logic.
/// Tests focus on business rule enforcement (user existence, time slot validity, lock requirements).
/// Transaction behavior is tested via integration tests.
/// </summary>
public class CreateBookingCommandHandlerTests
{
    private readonly Mock<IBookingRepository> _bookingRepoMock = new();
    private readonly Mock<ITimeSlotRepository> _timeSlotRepoMock = new();
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IBookingLockRepository> _lockRepoMock = new();
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ISystemConfigurationRepository> _systemConfigMock = new();
    private readonly Mock<IMediator> _mediatorMock = new();
    private readonly Mock<ILogger<CreateBookingCommandHandler>> _loggerMock = new();
    private readonly PricingDomainService _pricingService = new();

    public CreateBookingCommandHandlerTests()
    {
    }

    private CreateBookingCommandHandler CreateHandler() => new(
        _bookingRepoMock.Object,
        _timeSlotRepoMock.Object,
        _userRepoMock.Object,
        _lockRepoMock.Object,
        _contextMock.Object,
        _systemConfigMock.Object,
        _pricingService,
        _mediatorMock.Object,
        _loggerMock.Object
    );

    [Fact]
    public async Task Handle_UserNotFound_ReturnsFailure()
    {
        // Arrange
        _userRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var command = new CreateBookingCommand(Guid.NewGuid(), Guid.NewGuid(), DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)));

        // Act
        var result = await CreateHandler().Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Be("User not found");
    }

    [Fact]
    public async Task Handle_TimeSlotNotFound_ReturnsFailure()
    {
        // Arrange
        _userRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _timeSlotRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TimeSlot?)null);

        var command = new CreateBookingCommand(Guid.NewGuid(), Guid.NewGuid(), DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)));

        // Act
        var result = await CreateHandler().Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Be("Time slot not found");
    }

    [Fact]
    public async Task Handle_NoActiveLock_ReturnsFailure()
    {
        // Arrange
        var timeSlotId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var bookingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

        _userRepoMock.Setup(r => r.ExistsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var timeSlot = TimeSlot.Create(Guid.NewGuid(),
            TimeRange.Create(TimeSpan.FromHours(8), TimeSpan.FromHours(9)),
            Money.Create(200000, "VND"));
        _timeSlotRepoMock.Setup(r => r.GetByIdAsync(timeSlotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(timeSlot);

        _lockRepoMock.Setup(r => r.GetUserLockAsync(timeSlotId, bookingDate, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BookingLock?)null);

        var command = new CreateBookingCommand(userId, timeSlotId, bookingDate);

        // Act
        var result = await CreateHandler().Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("No active lock found");
    }
}
