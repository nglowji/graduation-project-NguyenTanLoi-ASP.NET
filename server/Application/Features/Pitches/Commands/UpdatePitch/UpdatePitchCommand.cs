using Application.Common.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Pitches.Commands.UpdatePitch;

public record UpdatePitchCommand : IRequest<Result<Unit>>
{
    public Guid Id { get; init; }
    public Guid OwnerId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string? MapLink { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
    public string? Description { get; init; }
    public PitchType PitchType { get; init; }
    public bool IsIndoor { get; init; }
    public List<string>? Images { get; init; }
    public List<PitchTimeSlotRequest>? TimeSlots { get; init; }
    public List<PitchServiceRequest>? Services { get; init; }
}
