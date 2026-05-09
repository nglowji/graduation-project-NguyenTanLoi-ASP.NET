using MediatR;

namespace Application.Features.Payments.Notifications;

public record PaymentSucceededNotification(
    Guid BookingId,
    string CustomerEmail,
    string CustomerName,
    string PitchName,
    string BookingDate,
    string TimeSlot,
    decimal Amount
) : INotification;
