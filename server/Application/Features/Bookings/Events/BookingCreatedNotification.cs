using MediatR;

namespace Application.Features.Bookings.Events;

/// <summary>
/// Notification raised when a booking is successfully created.
/// Used to trigger side effects: email, cache invalidation, real-time notifications.
/// </summary>
public record BookingCreatedNotification(
    Guid BookingId,
    Guid UserId,
    Guid PitchId,
    Guid TimeSlotId,
    DateOnly BookingDate
) : INotification;
