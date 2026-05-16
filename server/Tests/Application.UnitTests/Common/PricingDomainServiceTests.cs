using Domain.Entities;
using Domain.Enums;
using Domain.Exceptions;
using Domain.Services;
using Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace Application.UnitTests.Common;

public class PricingDomainServiceTests
{
    private readonly PricingDomainService _sut;

    public PricingDomainServiceTests()
    {
        _sut = new PricingDomainService();
    }

    [Fact]
    public void CalculateEffectivePrice_ShouldReturnBasePrice_WhenNormalHourAndWeekday()
    {
        // Arrange
        var date = new DateOnly(2024, 5, 8); // Wednesday
        var basePrice = Money.Create(200000, "VND");
        var timeSlot = CreateTimeSlot(new TimeSpan(10, 0, 0), basePrice);

        // Act
        var result = _sut.CalculateEffectivePrice(timeSlot, date);

        // Assert
        result.Amount.Should().Be(200000);
    }

    [Fact]
    public void CalculateEffectivePrice_ShouldApplyPeakMultiplier_WhenPeakHour()
    {
        // Arrange
        var date = new DateOnly(2024, 5, 8); // Wednesday
        var basePrice = Money.Create(200000, "VND");
        var timeSlot = CreateTimeSlot(new TimeSpan(18, 0, 0), basePrice); // 6 PM is peak

        // Act
        var result = _sut.CalculateEffectivePrice(timeSlot, date);

        // Assert
        result.Amount.Should().Be(260000); // 200k * 1.3
    }

    [Fact]
    public void CalculateEffectivePrice_ShouldApplyOffPeakMultiplier_WhenLateNight()
    {
        // Arrange
        var date = new DateOnly(2024, 5, 8); // Wednesday
        var basePrice = Money.Create(200000, "VND");
        var timeSlot = CreateTimeSlot(new TimeSpan(23, 0, 0), basePrice); // 11 PM is off-peak

        // Act
        var result = _sut.CalculateEffectivePrice(timeSlot, date);

        // Assert
        result.Amount.Should().Be(160000); // 200k * 0.8
    }

    [Fact]
    public void CalculateEffectivePrice_ShouldApplyWeekendMultiplier_WhenSaturday()
    {
        // Arrange
        var date = new DateOnly(2024, 5, 11); // Saturday
        var basePrice = Money.Create(200000, "VND");
        var timeSlot = CreateTimeSlot(new TimeSpan(10, 0, 0), basePrice);

        // Act
        var result = _sut.CalculateEffectivePrice(timeSlot, date);

        // Assert
        result.Amount.Should().Be(220000); // 200k * 1.1
    }

    [Fact]
    public void CalculateBookingPrice_ShouldIncludeServicesAndDeposit()
    {
        // Arrange
        var date = new DateOnly(2024, 5, 8); // Wednesday
        var timeSlot = CreateTimeSlot(new TimeSpan(10, 0, 0), Money.Create(200000, "VND"));
        var services = new[]
        {
            new BookingServicePricing(Money.Create(50000, "VND"), 2),
            new BookingServicePricing(Money.Create(30000, "VND"), 1)
        };

        // Act
        var result = _sut.CalculateBookingPrice(timeSlot, date, services, 30);

        // Assert
        result.TimeSlotPrice.Amount.Should().Be(200000);
        result.ServicesTotal.Amount.Should().Be(130000);
        result.TotalPrice.Amount.Should().Be(330000);
        result.DepositAmount.Amount.Should().Be(99000);
    }

    [Fact]
    public void CalculateBookingPrice_InvalidServiceQuantity_ShouldThrowDomainException()
    {
        // Arrange
        var date = new DateOnly(2024, 5, 8);
        var timeSlot = CreateTimeSlot(new TimeSpan(10, 0, 0), Money.Create(200000, "VND"));
        var services = new[] { new BookingServicePricing(Money.Create(50000, "VND"), 0) };

        // Act
        var act = () => _sut.CalculateBookingPrice(timeSlot, date, services, 30);

        // Assert
        act.Should().Throw<DomainException>().WithMessage("*quantity*greater than zero*");
    }

    private TimeSlot CreateTimeSlot(TimeSpan startTime, Money price)
    {
        var timeRange = TimeRange.Create(startTime, startTime.Add(TimeSpan.FromHours(1)));
        return TimeSlot.Create(Guid.NewGuid(), timeRange, price);
    }
}
