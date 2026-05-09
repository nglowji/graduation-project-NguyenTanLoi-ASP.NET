using Domain.Entities;
using Domain.Enums;
using Domain.Exceptions;
using Domain.ValueObjects;
using FluentAssertions;

namespace Domain.UnitTests.Entities;

public class BookingTests
{
    private static readonly Guid ValidUserId = Guid.NewGuid();
    private static readonly Guid ValidTimeSlotId = Guid.NewGuid();
    private static readonly DateOnly FutureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
    private static readonly Money ValidPrice = Money.Create(200000, "VND");
    private static readonly Money ValidDeposit = Money.Create(60000, "VND"); // 30% of 200k

    [Fact]
    public void Create_ValidParameters_ReturnsBooking()
    {
        // Act
        var booking = Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, ValidDeposit);

        // Assert
        booking.Should().NotBeNull();
        booking.UserId.Should().Be(ValidUserId);
        booking.Status.Should().Be(BookingStatus.PendingDeposit);
        booking.CheckInCode.Should().NotBeNullOrEmpty();
        booking.CheckInCode.Should().HaveLength(8);
    }

    [Fact]
    public void Create_EmptyUserId_ThrowsDomainException()
    {
        // Act & Assert
        var act = () => Booking.Create(Guid.Empty, ValidTimeSlotId, FutureDate, ValidPrice, ValidDeposit);
        act.Should().Throw<DomainException>().WithMessage("*User ID*");
    }

    [Fact]
    public void Create_DepositTooLow_ThrowsDomainException()
    {
        // Arrange
        var lowDeposit = Money.Create(10000, "VND"); // Less than 30%

        // Act & Assert
        var act = () => Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, lowDeposit);
        act.Should().Throw<DomainException>().WithMessage("*at least 30%*");
    }

    [Fact]
    public void Create_DepositExceedsTotal_ThrowsDomainException()
    {
        // Arrange
        var highDeposit = Money.Create(300000, "VND");

        // Act & Assert
        var act = () => Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, highDeposit);
        act.Should().Throw<DomainException>().WithMessage("*exceed*");
    }

    [Fact]
    public void Confirm_PendingDepositStatus_Succeeds()
    {
        // Arrange
        var booking = Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, ValidDeposit);

        // Act
        booking.Confirm();

        // Assert
        booking.Status.Should().Be(BookingStatus.Confirmed);
    }

    [Fact]
    public void Cancel_WithReason_SetsStatusAndReason()
    {
        // Arrange
        var booking = Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, ValidDeposit);

        // Act
        booking.Cancel("Changed plans");

        // Assert
        booking.Status.Should().Be(BookingStatus.Cancelled);
        booking.CancellationReason.Should().Be("Changed plans");
        booking.CancelledAt.Should().NotBeNull();
    }

    [Fact]
    public void Cancel_WithoutReason_ThrowsDomainException()
    {
        // Arrange
        var booking = Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, ValidDeposit);

        // Act & Assert
        var act = () => booking.Cancel("");
        act.Should().Throw<DomainException>().WithMessage("*reason*required*");
    }

    [Fact]
    public void Cancel_AlreadyCancelled_ThrowsDomainException()
    {
        // Arrange
        var booking = Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, ValidDeposit);
        booking.Cancel("First cancel");

        // Act & Assert
        var act = () => booking.Cancel("Second cancel");
        act.Should().Throw<DomainException>().WithMessage("*already cancelled*");
    }

    [Fact]
    public void CalculateRemainingAmount_ReturnsCorrectValue()
    {
        // Arrange
        var booking = Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, ValidDeposit);

        // Act
        var remaining = booking.CalculateRemainingAmount();

        // Assert
        remaining.Amount.Should().Be(140000m); // 200000 - 60000
    }

    [Fact]
    public void CanBeCancelled_PendingDeposit_ReturnsTrue()
    {
        // Arrange
        var booking = Booking.Create(ValidUserId, ValidTimeSlotId, FutureDate, ValidPrice, ValidDeposit);

        // Assert
        booking.CanBeCancelled().Should().BeTrue();
    }
}

public class PitchTests
{
    [Fact]
    public void Create_ValidParameters_ReturnsPitch()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var address = Address.Create("123 Street", "Ward 1", "District 1", "HCMC", 10.762622, 106.660172);

        // Act
        var pitch = Pitch.Create(ownerId, "Sân A", PitchType.Football5, address, "Sân cỏ nhân tạo");

        // Assert
        pitch.Should().NotBeNull();
        pitch.Name.Should().Be("Sân A");
        pitch.Status.Should().Be(PitchStatus.PendingApproval);
        pitch.AverageRating.Should().Be(0);
    }

    [Fact]
    public void Create_EmptyName_ThrowsDomainException()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var address = Address.Create("123 Street", "Ward 1", "District 1", "HCMC", 10.762622, 106.660172);

        // Act & Assert
        var act = () => Pitch.Create(ownerId, "", PitchType.Football5, address);
        act.Should().Throw<DomainException>().WithMessage("*name*required*");
    }

    [Fact]
    public void Approve_PendingStatus_TransitionsToActive()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var address = Address.Create("123 Street", "Ward 1", "District 1", "HCMC", 10.762622, 106.660172);
        var pitch = Pitch.Create(ownerId, "Sân B", PitchType.Football7, address);

        // Act
        pitch.Approve();

        // Assert
        pitch.Status.Should().Be(PitchStatus.Active);
    }

    [Fact]
    public void Approve_AlreadyActive_ThrowsDomainException()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var address = Address.Create("123 Street", "Ward 1", "District 1", "HCMC", 10.762622, 106.660172);
        var pitch = Pitch.Create(ownerId, "Sân C", PitchType.Football5, address);
        pitch.Approve();

        // Act & Assert
        var act = () => pitch.Approve();
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void IsOwnedBy_CorrectOwner_ReturnsTrue()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var address = Address.Create("123 Street", "Ward 1", "District 1", "HCMC", 10.762622, 106.660172);
        var pitch = Pitch.Create(ownerId, "Sân D", PitchType.Football5, address);

        // Assert
        pitch.IsOwnedBy(ownerId).Should().BeTrue();
        pitch.IsOwnedBy(Guid.NewGuid()).Should().BeFalse();
    }
}

public class TimeRangeTests
{
    [Fact]
    public void Create_ValidTimes_ReturnsTimeRange()
    {
        // Act
        var range = TimeRange.Create(TimeSpan.FromHours(8), TimeSpan.FromHours(9));

        // Assert
        range.StartTime.Should().Be(TimeSpan.FromHours(8));
        range.EndTime.Should().Be(TimeSpan.FromHours(9));
        range.Duration.Should().Be(TimeSpan.FromHours(1));
    }

    [Fact]
    public void Create_StartAfterEnd_ThrowsException()
    {
        var act = () => TimeRange.Create(TimeSpan.FromHours(10), TimeSpan.FromHours(8));
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void OverlapsWith_OverlappingRanges_ReturnsTrue()
    {
        var range1 = TimeRange.Create(TimeSpan.FromHours(8), TimeSpan.FromHours(10));
        var range2 = TimeRange.Create(TimeSpan.FromHours(9), TimeSpan.FromHours(11));

        range1.OverlapsWith(range2).Should().BeTrue();
    }

    [Fact]
    public void OverlapsWith_NonOverlappingRanges_ReturnsFalse()
    {
        var range1 = TimeRange.Create(TimeSpan.FromHours(8), TimeSpan.FromHours(9));
        var range2 = TimeRange.Create(TimeSpan.FromHours(10), TimeSpan.FromHours(11));

        range1.OverlapsWith(range2).Should().BeFalse();
    }
}

public class MoneyTests
{
    [Fact]
    public void Create_ValidAmount_ReturnsMoney()
    {
        var money = Money.Create(100000, "VND");
        money.Amount.Should().Be(100000);
        money.Currency.Should().Be("VND");
    }

    [Fact]
    public void Add_SameCurrency_ReturnsSum()
    {
        var a = Money.Create(100000, "VND");
        var b = Money.Create(50000, "VND");
        var sum = a.Add(b);
        sum.Amount.Should().Be(150000);
    }

    [Fact]
    public void Subtract_SameCurrency_ReturnsDifference()
    {
        var a = Money.Create(200000, "VND");
        var b = Money.Create(60000, "VND");
        var diff = a.Subtract(b);
        diff.Amount.Should().Be(140000);
    }

    [Fact]
    public void CalculatePercentage_30Percent_ReturnsCorrectAmount()
    {
        var money = Money.Create(200000, "VND");
        var result = money.CalculatePercentage(30);
        result.Amount.Should().Be(60000);
    }
}
