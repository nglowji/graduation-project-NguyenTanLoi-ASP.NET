using Application.Common.DTOs;
using Application.Features.Pitches.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Pitches.Queries.SearchPitches;

public record SearchPitchesQuery(
    string? SearchTerm,
    PitchType? Type,
    string? SportType,
    decimal? MinPrice,
    decimal? MaxPrice,
    string? Province,
    string? District,
    string? Ward,
    decimal? MinRating,
    double? Latitude,
    double? Longitude,
    double? RadiusKm,
    string? SortBy,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<PitchDto>>>;
