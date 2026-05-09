using Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Events;

/// <summary>
/// Handles cache invalidation and real-time notifications after booking creation.
/// </summary>
public class BookingCreatedNotificationHandler : INotificationHandler<BookingCreatedNotification>
{
    private readonly IBookingNotificationService _notificationService;
    private readonly ICacheService _cacheService;
    private readonly ILogger<BookingCreatedNotificationHandler> _logger;

    public BookingCreatedNotificationHandler(
        IBookingNotificationService notificationService,
        ICacheService cacheService,
        ILogger<BookingCreatedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task Handle(BookingCreatedNotification notification, CancellationToken cancellationToken)
    {
        try
        {
            // Invalidate available slots cache
            var cacheKey = $"available_slots_{notification.PitchId}_{notification.BookingDate:yyyyMMdd}";
            await _cacheService.RemoveAsync(cacheKey, cancellationToken);

            // Send real-time notification via SignalR
            await _notificationService.NotifyBookingCreatedAsync(
                notification.PitchId,
                notification.TimeSlotId,
                notification.BookingDate,
                cancellationToken);

            _logger.LogInformation(
                "Cache invalidated and real-time notification sent for booking {BookingId}",
                notification.BookingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process notifications for booking {BookingId}",
                notification.BookingId);
        }
    }
}
