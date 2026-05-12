using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class WaitlistRepository : BaseRepository<WaitlistEntry>, IWaitlistRepository
{
    public WaitlistRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<WaitlistEntry>> GetWaitingEntriesAsync(Guid timeSlotId, DateOnly date, CancellationToken cancellationToken = default)
    {
        return await _context.WaitlistEntries
            .Include(w => w.User)
            .Include(w => w.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
            .Where(w => w.TimeSlotId == timeSlotId && 
                        w.BookingDate == date && 
                        w.Status == WaitlistStatus.Waiting)
            .OrderBy(w => w.CreatedAt) // FIFO
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> IsUserOnWaitlistAsync(Guid userId, Guid timeSlotId, DateOnly date, CancellationToken cancellationToken = default)
    {
        return await _context.WaitlistEntries
            .AnyAsync(w => w.UserId == userId && 
                           w.TimeSlotId == timeSlotId && 
                           w.BookingDate == date && 
                           w.Status == WaitlistStatus.Waiting, 
                           cancellationToken);
    }
}
