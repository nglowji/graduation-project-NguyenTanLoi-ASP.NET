using Domain.Entities;
using Domain.Enums;
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
    public void CalculateEffectivePrice_NormalWeekdayHour_ShouldReturnBasePrice()
    {
        // Arrange
        var basePrice = 100000m;
        var pitch = CreateTestPitch();
        var timeSlot = TimeSlot.Create(pitch.Id, TimeRange.Create(TimeSpan.FromHours(10), TimeSpan.FromHours(11)), Money.Create(basePrice));
        var weekdayDate = new DateOnly(2026, 5, 4); // Monday

        // Act
        var result = _sut.CalculateEffectivePrice(timeSlot, weekdayDate);

        // Assert
        result.Amount.Should().Be(basePrice);
    }

    [Fact]
    public void CalculateEffectivePrice_PeakHourWeekday_ShouldAdd30Percent()
    {
        // Arrange
        var basePrice = 100000m;
        var pitch = CreateTestPitch();
        var peakTimeSlot = TimeSlot.Create(pitch.Id, TimeRange.Create(TimeSpan.FromHours(18), TimeSpan.FromHours(19)), Money.Create(basePrice));
        var weekdayDate = new DateOnly(2026, 5, 4); // Monday

        // Act
        var result = _sut.CalculateEffectivePrice(peakTimeSlot, weekdayDate);

        // Assert
        result.Amount.Should().Be(basePrice * 1.3m);
    }

    [Fact]
    public void CalculateEffectivePrice_NormalWeekendHour_ShouldAdd10Percent()
    {
        // Arrange
        var basePrice = 100000m;
        var pitch = CreateTestPitch();
        var timeSlot = TimeSlot.Create(pitch.Id, TimeRange.Create(TimeSpan.FromHours(10), TimeSpan.FromHours(11)), Money.Create(basePrice));
        var weekendDate = new DateOnly(2026, 5, 10); // Sunday

        // Act
        var result = _sut.CalculateEffectivePrice(timeSlot, weekendDate);

        // Assert
        result.Amount.Should().Be(basePrice * 1.1m);
    }

    private Pitch CreateTestPitch()
    {
        return Pitch.Create(Guid.NewGuid(), "Test Pitch", PitchType.Badminton, Address.Create("123", "Ward 1", "Dist 1", "City", 10.123, 106.123), "Desc");
    }
}
