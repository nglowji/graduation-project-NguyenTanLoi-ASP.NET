using Application.Common.Models;
using Domain.Enums;
using MediatR;

namespace Application.Features.Pitches.Commands.CreatePitch;

public record CreatePitchCommand(
    Guid OwnerId,
    string Name,
    PitchType Type,
    string Street,
    string Ward,
    string District,
    string City,
    double Latitude,
    double Longitude,
    string? Description
) : IRequest<Result<Guid>>;
