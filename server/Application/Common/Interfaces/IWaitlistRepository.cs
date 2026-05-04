using Domain.Entities;
using Domain.Enums;

namespace Application.Common.Interfaces;

public interface IWaitlistRepository : IRepository<WaitlistEntry>
{
    Task<List<WaitlistEntry>> GetWaitingEntriesAsync(Guid timeSlotId, DateOnly date, CancellationToken cancellationToken = default);
    Task<bool> IsUserOnWaitlistAsync(Guid userId, Guid timeSlotId, DateOnly date, CancellationToken cancellationToken = default);
}
