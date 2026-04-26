using Application.Common.Models;
using Application.Features.Pitches.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Pitches.Queries.SearchPitches;

public record SearchPitchesQuery(
    string? SearchTerm,
    PitchType? Type,
    decimal? MinPrice,
    decimal? MaxPrice,
    double? Latitude,
    double? Longitude,
    double? RadiusKm,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<PitchDto>>>;
