using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly ApplicationDbContext _context;

    public ReviewRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Review?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IReadOnlyList<Review>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Reviews.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<Review> AddAsync(Review entity, CancellationToken cancellationToken = default)
    {
        await _context.Reviews.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(Review entity, CancellationToken cancellationToken = default)
    {
        _context.Reviews.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Review entity, CancellationToken cancellationToken = default)
    {
        _context.Reviews.Remove(entity);
        return Task.CompletedTask;
    }

    public async Task<bool> HasUserReviewedBookingAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews.AnyAsync(r => r.BookingId == bookingId, cancellationToken);
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
