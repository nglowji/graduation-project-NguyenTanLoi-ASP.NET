using Application.Common.Models;
using Application.Features.Pitches.DTOs;
using MediatR;

namespace Application.Features.Pitches.Queries.GetAvailableTimeSlots;

public record GetAvailableTimeSlotsQuery(
    Guid PitchId,
    DateOnly Date
) : IRequest<Result<List<TimeSlotDto>>>;
