using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ReviewRepository : BaseRepository<Review>, IReviewRepository
{
    public ReviewRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<bool> HasUserReviewedBookingAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews.AnyAsync(r => r.BookingId == bookingId, cancellationToken);
    }

    public async Task<Review?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews
            .AsNoTracking()
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.BookingId == bookingId, cancellationToken);
    }

    public async Task<Review?> GetTrackedByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.BookingId == bookingId, cancellationToken);
    }

    public async Task<List<Review>> GetByPitchIdAsync(Guid pitchId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.PitchId == pitchId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetTotalCountByPitchIdAsync(Guid pitchId, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews.CountAsync(r => r.PitchId == pitchId, cancellationToken);
    }
}
