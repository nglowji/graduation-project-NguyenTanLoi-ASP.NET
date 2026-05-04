using Application.Common.Models;
using MediatR;

namespace Application.Features.Waitlist.Commands.JoinWaitlist;

public record JoinWaitlistCommand(
    Guid UserId,
    Guid TimeSlotId,
    DateOnly Date
) : IRequest<Result<Guid>>;
