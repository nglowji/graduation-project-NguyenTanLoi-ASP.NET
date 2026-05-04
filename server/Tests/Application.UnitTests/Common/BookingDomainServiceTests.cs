using Domain.Entities;
using Domain.Enums;
using Domain.Services;
using Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace Application.UnitTests.Common;

public class BookingDomainServiceTests
{
    private readonly BookingDomainService _sut;

    public BookingDomainServiceTests()
    {
        _sut = new BookingDomainService();
    }

    [Fact]
    public void ShouldRefundDeposit_BookingInFarFuture_ShouldBeTrue()
    {
        // Arrange
        var bookingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var booking = CreateTestBooking(bookingDate);
        var minHours = 24;

        // Act
        var result = _sut.ShouldRefundDeposit(booking, minHours);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void CalculateRefundAmount_BookingInFarFuture_ShouldReturnFullDeposit()
    {
        // Arrange
        var depositAmount = 30000m;
        var bookingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var booking = CreateTestBooking(bookingDate, depositAmount);
        var minHours = 24;

        // Act
        var result = _sut.CalculateRefundAmount(booking, minHours);

        // Assert
        result.Should().Be(depositAmount);
    }

    private Booking CreateTestBooking(DateOnly date, decimal deposit = 30000m)
    {
        // We need to use Reflection or just Create since it's an entity
        return Booking.Create(Guid.NewGuid(), Guid.NewGuid(), date, Money.Create(100000m), Money.Create(deposit));
    }
}
