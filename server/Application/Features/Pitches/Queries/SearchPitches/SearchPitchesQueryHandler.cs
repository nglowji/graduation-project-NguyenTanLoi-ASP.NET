using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Features.Pitches.DTOs;
using AutoMapper;
using MediatR;

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
        PagedResult<Domain.Entities.Pitch> pitches;

        if (request.Latitude.HasValue && request.Longitude.HasValue && request.RadiusKm.HasValue)
        {
            var nearbyPitches = await _pitchRepository.SearchNearbyAsync(
                request.Latitude.Value,
                request.Longitude.Value,
                request.RadiusKm.Value,
                request.Type,
                cancellationToken
            );

            var filteredPitches = ApplyFilters(nearbyPitches, request);
            var paginatedPitches = ApplyPagination(filteredPitches, request.PageNumber, request.PageSize);

            pitches = new PagedResult<Domain.Entities.Pitch>(
                paginatedPitches.ToList(),
                filteredPitches.Count(),
                request.PageNumber,
                request.PageSize
            );
        }
        else
        {
            pitches = await _pitchRepository.SearchAsync(
                request.SearchTerm,
                request.Type,
                request.MinPrice,
                request.MaxPrice,
                request.PageNumber,
                request.PageSize,
                cancellationToken
            );
        }

        var pitchDtos = _mapper.Map<List<PitchDto>>(pitches.Items);

        var result = new PagedResult<PitchDto>(
            pitchDtos,
            pitches.TotalCount,
            pitches.PageNumber,
            pitches.PageSize
        );

        return Result<PagedResult<PitchDto>>.Success(result);
    }

    private static IEnumerable<Domain.Entities.Pitch> ApplyFilters(
        IReadOnlyList<Domain.Entities.Pitch> pitches,
        SearchPitchesQuery query)
    {
        var filtered = pitches.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            filtered = filtered.Where(p =>
                p.Name.Contains(query.SearchTerm, StringComparison.OrdinalIgnoreCase)
            );
        }

        return filtered;
    }

    private static IEnumerable<Domain.Entities.Pitch> ApplyPagination(
        IEnumerable<Domain.Entities.Pitch> pitches,
        int pageNumber,
        int pageSize)
    {
        return pitches
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize);
    }
}
