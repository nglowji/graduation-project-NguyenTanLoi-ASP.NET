using Application.Common.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Pitches.Commands.CreatePitch;

public record CreatePitchCommand : IRequest<Result<Guid>>
{
    public Guid OwnerId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string? Description { get; init; }
    public PitchType PitchType { get; init; }
    public bool IsIndoor { get; init; }
    public List<string>? Images { get; init; }
    public List<TimeSlotRequest>? TimeSlots { get; init; }
}

public record TimeSlotRequest(TimeSpan StartTime, TimeSpan EndTime, decimal Price);
