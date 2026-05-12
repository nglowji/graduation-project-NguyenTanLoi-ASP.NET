using Application.Common.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Pitches.Commands.UpdatePitch;

public record UpdatePitchCommand(
    Guid Id,
    Guid OwnerId,
    string Name,
    string Address,
    string? Description,
    PitchType PitchType,
    bool IsIndoor,
    List<string> Images,
    List<PitchTimeSlotRequest> TimeSlots,
    List<PitchServiceRequest> Services
) : IRequest<Result<Unit>>;
