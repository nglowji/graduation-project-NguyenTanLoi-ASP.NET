namespace Application.Common.Interfaces;

public interface IBookingNotificationService
{
    Task NotifyTimeSlotStatusChangedAsync(Guid pitchId, Guid timeSlotId, string status, DateOnly date, CancellationToken cancellationToken = default);
    Task NotifyBookingCreatedAsync(Guid pitchId, Guid timeSlotId, DateOnly date, CancellationToken cancellationToken = default);
    Task NotifyBookingCancelledAsync(Guid pitchId, Guid timeSlotId, DateOnly date, CancellationToken cancellationToken = default);
}
