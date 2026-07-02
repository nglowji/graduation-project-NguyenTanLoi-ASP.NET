using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingRepository : BaseRepository<Booking>, IBookingRepository
{
    public BookingRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<Booking>> GetByUserIdAsync(
        Guid userId,
        int pageNumber,
        int pageSize,
        BookingStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = BuildUserBookingsQuery(userId, status);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
                    .ThenInclude(p => p.SportCenter)
            .Include(b => b.Services)
            .ToListAsync(cancellationToken);

        return new PagedResult<Booking>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<IReadOnlyList<Booking>> GetByTimeSlotAndDateAsync(
        Guid timeSlotId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Where(b => b.TimeSlotId == timeSlotId && b.BookingDate == date)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> IsTimeSlotAvailableAsync(
        Guid timeSlotId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var hasConflict = await _context.Bookings
            .AsNoTracking()
            .AnyAsync(b =>
                b.TimeSlotId == timeSlotId &&
                b.BookingDate == date &&
                (b.Status == BookingStatus.PendingDeposit ||
                 b.Status == BookingStatus.Confirmed ||
                 b.Status == BookingStatus.Completed),
                cancellationToken);

        return !hasConflict;
    }

    public async Task<HashSet<Guid>> GetUnavailableTimeSlotIdsAsync(
        IEnumerable<Guid> timeSlotIds,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var slotIdList = timeSlotIds as IReadOnlyCollection<Guid> ?? timeSlotIds.ToList();
        if (slotIdList.Count == 0)
            return [];

        var unavailable = await _context.Bookings
            .AsNoTracking()
            .Where(b =>
                slotIdList.Contains(b.TimeSlotId) &&
                b.BookingDate == date &&
                (b.Status == BookingStatus.PendingDeposit ||
                 b.Status == BookingStatus.Confirmed ||
                 b.Status == BookingStatus.Completed))
            .Select(b => b.TimeSlotId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return unavailable.ToHashSet();
    }

    public async Task<Booking?> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
                    .ThenInclude(p => p.SportCenter)
            .Include(b => b.Services)
            .Include(b => b.Transaction)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<Booking?> GetTrackedWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
                    .ThenInclude(p => p.SportCenter)
            .Include(b => b.Services)
            .Include(b => b.Transaction)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Booking>> GetByPitchesAsync(
        IEnumerable<Guid> pitchIds,
        CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .AsSplitQuery()
            .Include(b => b.User)
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
            .Where(b => pitchIds.Contains(b.TimeSlot.PitchId))
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Booking>> GetByPitchesAndDateRangeAsync(
        IEnumerable<Guid> pitchIds,
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .AsSplitQuery()
            .Include(b => b.User)
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
            .Include(b => b.Services)
            .Where(b => pitchIds.Contains(b.TimeSlot.PitchId) &&
                        b.BookingDate >= startDate &&
                        b.BookingDate <= endDate)
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Booking> BuildUserBookingsQuery(Guid userId, BookingStatus? status)
    {
        var query = _context.Bookings
            .AsNoTracking()
            .Where(b => b.UserId == userId);

        if (status.HasValue)
        {
            query = query.Where(b => b.Status == status.Value);
        }

        return query;
    }

    public async Task<IReadOnlyList<Booking>> GetAllByDateRangeAsync(
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Where(b => b.BookingDate >= startDate && b.BookingDate <= endDate
                && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<Booking>> GetByOwnerIdPagedAsync(
        Guid ownerId,
        int pageNumber,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .AsNoTracking()
            .AsSplitQuery()
            .Include(b => b.User)
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
            .Include(b => b.Services)
            .Where(b => b.TimeSlot.Pitch.OwnerId == ownerId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var statusEnum))
            query = query.Where(b => b.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Booking>(items, totalCount, pageNumber, pageSize);
    }
}
