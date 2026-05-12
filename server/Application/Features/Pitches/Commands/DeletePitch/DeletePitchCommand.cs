using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Pitches.Commands.DeletePitch;

public record DeletePitchCommand(Guid Id, Guid OwnerId) : IRequest<Result<Unit>>;
