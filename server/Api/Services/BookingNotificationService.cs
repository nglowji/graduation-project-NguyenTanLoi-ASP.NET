using Api.Hubs;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Api.Services;

public class BookingNotificationService : IBookingNotificationService
{
    private readonly IHubContext<BookingHub> _hubContext;
    private readonly ILogger<BookingNotificationService> _logger;

    public BookingNotificationService(
        IHubContext<BookingHub> hubContext,
        ILogger<BookingNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyTimeSlotStatusChangedAsync(Guid pitchId, Guid timeSlotId, string status, DateOnly date, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group(pitchId.ToString())
                .SendAsync("TimeSlotStatusChanged", timeSlotId, status, date.ToString("yyyy-MM-dd"), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying TimeSlotStatusChanged for pitch {PitchId}", pitchId);
        }
    }

    public async Task NotifyBookingCreatedAsync(Guid pitchId, Guid timeSlotId, DateOnly date, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group(pitchId.ToString())
                .SendAsync("BookingCreated", pitchId, timeSlotId, date.ToString("yyyy-MM-dd"), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying BookingCreated for pitch {PitchId}", pitchId);
        }
    }

    public async Task NotifyBookingCancelledAsync(Guid pitchId, Guid timeSlotId, DateOnly date, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group(pitchId.ToString())
                .SendAsync("BookingCancelled", pitchId, timeSlotId, date.ToString("yyyy-MM-dd"), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying BookingCancelled for pitch {PitchId}", pitchId);
        }
    }
}
