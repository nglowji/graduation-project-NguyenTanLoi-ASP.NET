using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Pitches.DTOs;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Pitches.Queries.SearchPitches;

public class SearchPitchesQueryHandler : IRequestHandler<SearchPitchesQuery, Result<PagedResult<PitchDto>>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IMapper _mapper;

    public SearchPitchesQueryHandler(IPitchRepository pitchRepository, IMapper mapper)
    {
        _pitchRepository = pitchRepository;
        _mapper = mapper;
    }

    public async Task<Result<PagedResult<PitchDto>>> Handle(
        SearchPitchesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _pitchRepository.AsQueryable();

        // 1. Apply Filters (at Database level)
        query = ApplyFilters(query, request);

        // 2. Count Total (at Database level)
        var totalCount = await query.CountAsync(cancellationToken);

        // 3. Apply Sorting and Pagination (at Database level)
        var pagedQuery = query
            .OrderByDescending(p => p.AverageRating)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize);

        // 4. Project to DTO (at Database level - No SELECT *)
        var items = await pagedQuery
            .ProjectTo<PitchDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        var result = new PagedResult<PitchDto>(
            items,
            totalCount,
            request.PageNumber,
            request.PageSize
        );

        return Result<PagedResult<PitchDto>>.Success(result);
    }

    private static IQueryable<Domain.Entities.Pitch> ApplyFilters(
        IQueryable<Domain.Entities.Pitch> query,
        SearchPitchesQuery request)
    {
        var filtered = query.Where(p => p.Status == Domain.Enums.PitchStatus.Active);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            filtered = filtered.Where(p =>
                p.Name.Contains(request.SearchTerm) || 
                (p.Description != null && p.Description.Contains(request.SearchTerm))
            );
        }

        if (request.Type.HasValue)
        {
            filtered = filtered.Where(p => p.Type == request.Type.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SportType))
        {
            if (request.SportType.Equals("Football", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(p => 
                    p.Type == Domain.Enums.PitchType.Football5 || 
                    p.Type == Domain.Enums.PitchType.Football7 || 
                    p.Type == Domain.Enums.PitchType.Football11);
            }
            else if (Enum.TryParse<Domain.Enums.PitchType>(request.SportType, true, out var parsedType))
            {
                filtered = filtered.Where(p => p.Type == parsedType);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Province))
        {
            filtered = filtered.Where(p => p.SportCenter != null && p.SportCenter.Address.City == request.Province);
        }

        if (!string.IsNullOrWhiteSpace(request.District))
        {
            filtered = filtered.Where(p => p.SportCenter != null && p.SportCenter.Address.District == request.District);
        }

        if (request.MinRating.HasValue)
        {
            filtered = filtered.Where(p => p.AverageRating >= request.MinRating.Value);
        }

        if (request.MinPrice.HasValue || request.MaxPrice.HasValue)
        {
            filtered = filtered.Where(p => p.TimeSlots.Any(ts =>
                (!request.MinPrice.HasValue || ts.Price.Amount >= request.MinPrice.Value) &&
                (!request.MaxPrice.HasValue || ts.Price.Amount <= request.MaxPrice.Value)
            ));
        }

        // Geospatial filtering if coordinates provided
        if (request.Latitude.HasValue && request.Longitude.HasValue && request.RadiusKm.HasValue)
        {
            // Note: For production with large datasets, use spatial types (NetTopologySuite)
            // This is a simplified version that still runs at DB level for some providers
            // If not supported by provider, this might need a stored procedure or special spatial query
            // For now, we'll use a bounding box approach as a senior optimization
            double latRange = request.RadiusKm.Value / 111.0;
            double lonRange = request.RadiusKm.Value / (111.0 * Math.Cos(request.Latitude.Value * Math.PI / 180.0));

            filtered = filtered.Where(p => 
                p.SportCenter != null &&
                p.SportCenter.Address.Latitude >= request.Latitude.Value - latRange &&
                p.SportCenter.Address.Latitude <= request.Latitude.Value + latRange &&
                p.SportCenter.Address.Longitude >= request.Longitude.Value - lonRange &&
                p.SportCenter.Address.Longitude <= request.Longitude.Value + lonRange
            );
        }

        return filtered;
    }
}
