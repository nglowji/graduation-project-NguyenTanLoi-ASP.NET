using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class WaitlistRepository : IWaitlistRepository
{
    private readonly ApplicationDbContext _context;

    public WaitlistRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<WaitlistEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.WaitlistEntries.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IReadOnlyList<WaitlistEntry>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.WaitlistEntries.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<WaitlistEntry> AddAsync(WaitlistEntry entity, CancellationToken cancellationToken = default)
    {
        await _context.WaitlistEntries.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(WaitlistEntry entity, CancellationToken cancellationToken = default)
    {
        _context.WaitlistEntries.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(WaitlistEntry entity, CancellationToken cancellationToken = default)
    {
        _context.WaitlistEntries.Remove(entity);
        return Task.CompletedTask;
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
