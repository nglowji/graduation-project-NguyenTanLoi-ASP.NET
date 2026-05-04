using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PitchRepository : IPitchRepository
{
    private readonly ApplicationDbContext _context;

    public PitchRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Pitch?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Pitches
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Pitch>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Pitches
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Pitch> AddAsync(Pitch entity, CancellationToken cancellationToken = default)
    {
        await _context.Pitches.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(Pitch entity, CancellationToken cancellationToken = default)
    {
        _context.Pitches.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Pitch entity, CancellationToken cancellationToken = default)
    {
        _context.Pitches.Remove(entity);
        return Task.CompletedTask;
    }

    public async Task<PagedResult<Pitch>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        PitchType? type = null,
        PitchStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Pitches.AsNoTracking();

        if (type.HasValue)
        {
            query = query.Where(p => p.Type == type.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.AverageRating)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(p => p.Images)
            .ToListAsync(cancellationToken);

        return new PagedResult<Pitch>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<IReadOnlyList<Pitch>> GetByOwnerIdAsync(
        Guid ownerId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Pitches
            .AsNoTracking()
            .Where(p => p.OwnerId == ownerId)
            .Include(p => p.Images)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Pitch>> SearchNearbyAsync(
        double latitude,
        double longitude,
        double radiusKm,
        PitchType? type = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Pitches
            .AsNoTracking()
            .Where(p => p.Status == PitchStatus.Active);

        if (type.HasValue)
        {
            query = query.Where(p => p.Type == type.Value);
        }

        var pitches = await query
            .Include(p => p.Images)
            .ToListAsync(cancellationToken);

        // Filter by distance in memory (Haversine formula in Address value object)
        var nearbyPitches = pitches
            .Where(p => p.Address.CalculateDistanceTo(
                Domain.ValueObjects.Address.Create("", "", "", "", latitude, longitude)
            ) <= radiusKm)
            .ToList();

        return nearbyPitches;
    }

    public async Task<Pitch?> GetWithTimeSlotsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Pitches
            .AsNoTracking()
            .Include(p => p.TimeSlots)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Pitches.AnyAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Pitch>> SearchAsync(
        string? searchTerm,
        PitchType? type,
        decimal? minPrice,
        decimal? maxPrice,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Pitches
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.TimeSlots)
            .Where(p => p.Status == PitchStatus.Active);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(p => p.Name.Contains(searchTerm));
        }

        if (type.HasValue)
        {
            query = query.Where(p => p.Type == type.Value);
        }

        // Price filtering based on TimeSlots
        if (minPrice.HasValue || maxPrice.HasValue)
        {
            query = query.Where(p => p.TimeSlots.Any(ts =>
                (!minPrice.HasValue || ts.Price.Amount >= minPrice.Value) &&
                (!maxPrice.HasValue || ts.Price.Amount <= maxPrice.Value)
            ));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.AverageRating)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Pitch>(items, totalCount, pageNumber, pageSize);
    }
}
