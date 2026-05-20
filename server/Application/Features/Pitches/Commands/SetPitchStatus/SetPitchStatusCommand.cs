using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Pitches.Commands.SetPitchStatus;

public record SetPitchStatusCommand(
    Guid Id,
    Guid OwnerId,
    bool IsActive
) : IRequest<Result<Unit>>;
