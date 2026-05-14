using Application.Common.DTOs;
using Application.Features.Pitches.DTOs;
using MediatR;

namespace Application.Features.Pitches.Queries.GetPitchById;

public record GetPitchByIdQuery(Guid PitchId)
    : IRequest<Result<PitchDetailDto>>;
