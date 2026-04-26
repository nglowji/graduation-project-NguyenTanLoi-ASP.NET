using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly ApplicationDbContext _context;

    public BookingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Booking>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Booking> AddAsync(Booking entity, CancellationToken cancellationToken = default)
    {
        await _context.Bookings.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(Booking entity, CancellationToken cancellationToken = default)
    {
        _context.Bookings.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Booking entity, CancellationToken cancellationToken = default)
    {
        _context.Bookings.Remove(entity);
        return Task.CompletedTask;
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
                (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.PendingDeposit),
                cancellationToken);

        return !hasConflict;
    }

    public async Task<Booking?> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
            .Include(b => b.Transaction)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
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
}
