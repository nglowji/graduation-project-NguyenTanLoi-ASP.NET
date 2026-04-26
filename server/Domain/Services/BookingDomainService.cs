using Domain.Entities;
using Domain.Exceptions;

namespace Domain.Services;

/// <summary>
/// Domain Service for complex business logic involving multiple aggregates
/// </summary>
public class BookingDomainService
{
    public bool CanCancelBooking(Booking booking, int minimumCancellationHours)
    {
        if (!booking.CanBeCancelled())
            return false;

        var hoursUntilBooking = CalculateHoursUntilBooking(booking);
        return hoursUntilBooking >= minimumCancellationHours;
    }

    public void ValidateCancellationPolicy(Booking booking, int minimumCancellationHours)
    {
        if (!CanCancelBooking(booking, minimumCancellationHours))
        {
            var hoursUntilBooking = CalculateHoursUntilBooking(booking);
            throw new DomainException(
                $"Cannot cancel booking. Minimum cancellation time is {minimumCancellationHours} hours. " +
                $"Only {hoursUntilBooking} hours remaining until booking time."
            );
        }
    }

    public bool ShouldRefundDeposit(Booking booking, int minimumCancellationHours)
    {
        var hoursUntilBooking = CalculateHoursUntilBooking(booking);
        
        // Full refund if cancelled more than minimum hours before
        if (hoursUntilBooking >= minimumCancellationHours)
            return true;

        // No refund if cancelled within minimum hours
        return false;
    }

    public decimal CalculateRefundAmount(Booking booking, int minimumCancellationHours)
    {
        if (!ShouldRefundDeposit(booking, minimumCancellationHours))
            return 0;

        return booking.DepositAmount.Amount;
    }

    private static double CalculateHoursUntilBooking(Booking booking)
    {
        var bookingDateTime = booking.BookingDate.ToDateTime(TimeOnly.MinValue);
        var now = DateTime.UtcNow;
        var timeUntilBooking = bookingDateTime - now;

        return timeUntilBooking.TotalHours;
    }
}
