using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

public class BookingHub : Hub
{
    public async Task JoinPitchGroup(Guid pitchId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, pitchId.ToString());
    }

    public async Task LeavePitchGroup(Guid pitchId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, pitchId.ToString());
    }
}

public interface IBookingHubClient
{
    Task TimeSlotStatusChanged(Guid timeSlotId, string status, string? date = null);
    Task BookingCreated(Guid pitchId, Guid timeSlotId, string date);
    Task BookingCancelled(Guid pitchId, Guid timeSlotId, string date);
}
