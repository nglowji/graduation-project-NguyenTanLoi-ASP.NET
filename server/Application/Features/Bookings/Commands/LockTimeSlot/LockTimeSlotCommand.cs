using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.Bookings.Commands.LockTimeSlot;

public record LockTimeSlotCommand(
    Guid UserId,
    Guid TimeSlotId,
    DateOnly BookingDate,
    int LockDurationMinutes = 10
) : IRequest<Result<Guid>>, ITransactionalRequest;
