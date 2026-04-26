using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TimeSlotRepository : ITimeSlotRepository
{
    private readonly ApplicationDbContext _context;

    public TimeSlotRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TimeSlot?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TimeSlots
            .AsNoTracking()
            .FirstOrDefaultAsync(ts => ts.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<TimeSlot>> GetByPitchIdAsync(
        Guid pitchId,
        CancellationToken cancellationToken = default)
    {
        return await _context.TimeSlots
            .AsNoTracking()
            .Where(ts => ts.PitchId == pitchId)
            .OrderBy(ts => ts.TimeRange.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TimeSlot>> GetAvailableByPitchIdAsync(
        Guid pitchId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var timeSlots = await _context.TimeSlots
            .AsNoTracking()
            .Include(ts => ts.Bookings)
            .Where(ts => ts.PitchId == pitchId && ts.IsActive)
            .ToListAsync(cancellationToken);

        return timeSlots
            .Where(ts => ts.IsAvailableOn(date))
            .OrderBy(ts => ts.TimeRange.StartTime)
            .ToList();
    }
}
