using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingLockRepository : IBookingLockRepository
{
    private readonly ApplicationDbContext _context;

    public BookingLockRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BookingLock?> GetActiveLockAsync(
        Guid timeSlotId,
        DateOnly bookingDate,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _context.BookingLocks
            .Where(bl =>
                bl.TimeSlotId == timeSlotId &&
                bl.BookingDate == bookingDate &&
                !bl.IsReleased &&
                bl.ExpiresAt > now)
            .OrderByDescending(bl => bl.LockedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<BookingLock?> GetUserLockAsync(
        Guid timeSlotId,
        DateOnly bookingDate,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _context.BookingLocks
            .Where(bl =>
                bl.TimeSlotId == timeSlotId &&
                bl.BookingDate == bookingDate &&
                bl.UserId == userId &&
                !bl.IsReleased &&
                bl.ExpiresAt > now)
            .OrderByDescending(bl => bl.LockedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<BookingLock> AddAsync(
        BookingLock bookingLock,
        CancellationToken cancellationToken = default)
    {
        await _context.BookingLocks.AddAsync(bookingLock, cancellationToken);
        return bookingLock;
    }

    public Task UpdateAsync(
        BookingLock bookingLock,
        CancellationToken cancellationToken = default)
    {
        _context.BookingLocks.Update(bookingLock);
        return Task.CompletedTask;
    }

    public async Task<int> CleanupExpiredLocksAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _context.BookingLocks
            .Where(bl => !bl.IsReleased && bl.ExpiresAt <= now)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(bl => bl.IsReleased, true)
                    .SetProperty(bl => bl.ReleasedAt, now),
                cancellationToken
            );
    }
}
