using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Bookings.Commands.ReleaseLock;

public record ReleaseLockCommand(
    Guid LockId,
    Guid UserId
) : IRequest<Result>;
