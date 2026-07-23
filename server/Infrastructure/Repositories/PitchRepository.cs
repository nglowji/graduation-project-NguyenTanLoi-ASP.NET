using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PitchRepository : BaseRepository<Pitch>, IPitchRepository
{
    public PitchRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Pitch?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.SportCenter)
            .Include(p => p.TimeSlots)
            .Include(p => p.Images)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public override async Task<IReadOnlyList<Pitch>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(p => p.SportCenter)
            .Include(p => p.TimeSlots)
            .Include(p => p.Images)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Pitch>> GetActiveForRecommendationsAsync(
        DateOnly targetDate,
        CancellationToken cancellationToken = default)
    {
        return await _context.Pitches
            .AsNoTracking()
            .AsSplitQuery()
            .Where(p => p.Status == PitchStatus.Active)
            .OrderByDescending(p => p.AverageRating)
            .ThenBy(p => p.Name)
            .Take(40)
            .Include(p => p.SportCenter)
            .Include(p => p.Images.Where(image => image.IsPrimary))
            .Include(p => p.TimeSlots.Where(slot => slot.IsActive))
                .ThenInclude(slot => slot.Bookings.Where(booking =>
                    booking.BookingDate == targetDate &&
                    booking.Status != BookingStatus.Cancelled &&
                    booking.Status != BookingStatus.NoShow))
            .ToListAsync(cancellationToken);
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
            .Include(p => p.SportCenter)
            .ToListAsync(cancellationToken);

        return new PagedResult<Pitch>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<IReadOnlyList<Pitch>> GetByOwnerIdAsync(
        Guid ownerId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Pitches
            .AsNoTracking()
            .AsSplitQuery()
            .Where(p => p.OwnerId == ownerId)
            .Include(p => p.Images)
            .Include(p => p.TimeSlots)
            .Include(p => p.SportCenter)
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

        var latRange = radiusKm / 111.0;
        var lonRange = radiusKm / (111.0 * Math.Cos(latitude * Math.PI / 180.0));

        var pitches = await query
            .Where(p =>
                p.SportCenter != null &&
                p.SportCenter.Address.Latitude >= latitude - latRange &&
                p.SportCenter.Address.Latitude <= latitude + latRange &&
                p.SportCenter.Address.Longitude >= longitude - lonRange &&
                p.SportCenter.Address.Longitude <= longitude + lonRange)
            .Include(p => p.Images)
            .Include(p => p.SportCenter)
            .Include(p => p.Reviews)
            .ToListAsync(cancellationToken);

        // Filter by distance in memory (Haversine formula in Address value object)
        var nearbyPitches = pitches
            .Where(p => p.SportCenter != null && p.SportCenter.Address.CalculateDistanceTo(
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
            .Include(p => p.SportCenter)
            .Include(p => p.Reviews)
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Pitches.AnyAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Pitch>> SearchAsync(
        string? searchTerm,
        PitchType? type,
        string? sportType,
        decimal? minPrice,
        decimal? maxPrice,
        string? province,
        string? district,
        string? ward,
        decimal? minRating,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Pitches
            .AsNoTracking()
            .Where(p => p.Status == PitchStatus.Active)
            .AsQueryable();

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(p => p.Name.Contains(searchTerm) || p.Description!.Contains(searchTerm));
        }

        if (type.HasValue)
        {
            query = query.Where(p => p.Type == type.Value);
        }

        if (!string.IsNullOrEmpty(sportType))
        {
            // Simple mapping: Football includes Football5, Football7, Football11
            if (sportType.Equals("Football", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Type == PitchType.Football5 || p.Type == PitchType.Football7 || p.Type == PitchType.Football11);
            }
            else if (Enum.TryParse<PitchType>(sportType, true, out var parsedType))
            {
                query = query.Where(p => p.Type == parsedType);
            }
        }

        if (!string.IsNullOrWhiteSpace(province))
        {
            query = query.Where(p => p.SportCenter != null && p.SportCenter.Address.City == province);
        }

        if (!string.IsNullOrWhiteSpace(district))
        {
            query = query.Where(p => p.SportCenter != null && p.SportCenter.Address.District == district);
        }

        if (!string.IsNullOrWhiteSpace(ward))
        {
            query = query.Where(p => p.SportCenter != null && p.SportCenter.Address.Ward == ward);
        }

        if (minRating.HasValue)
        {
            query = query.Where(p =>
                p.Reviews.Any() &&
                p.Reviews.Average(review => review.Rating) >= (double)minRating.Value);
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
            .OrderByDescending(p => p.Reviews.Any() ? p.Reviews.Average(review => review.Rating) : 0)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(p => p.SportCenter)
            .Include(p => p.Images)
            .Include(p => p.Reviews)
            .ToListAsync(cancellationToken);

        return new PagedResult<Pitch>(items, totalCount, pageNumber, pageSize);
    }
}
