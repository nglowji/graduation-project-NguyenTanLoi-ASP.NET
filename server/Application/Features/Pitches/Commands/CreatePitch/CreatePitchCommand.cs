using Application.Common.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Pitches.Commands.CreatePitch;

public record CreatePitchCommand(
    Guid OwnerId,
    Guid SportCenterId,
    string Name,
    PitchType Type,
    string? Description
) : IRequest<Result<Guid>>;
