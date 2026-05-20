using Application.Common.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Pitches.Commands.UpdatePitch;

public record UpdatePitchCommand(
    Guid Id,
    Guid OwnerId,
    string Name,
    string? Description,
    PitchType PitchType,
    bool IsIndoor,
    List<string>? Images = null,
    List<PitchTimeSlotRequest>? TimeSlots = null,
    List<PitchServiceRequest>? Services = null
) : IRequest<Result<Unit>>;
