using Application.Common.Models;
using MediatR;

namespace Application.Features.Bookings.Commands.LockTimeSlot;

public record LockTimeSlotCommand(
    Guid UserId,
    Guid TimeSlotId,
    DateOnly BookingDate,
    int LockDurationMinutes = 10
) : IRequest<Result<Guid>>; // Returns lock ID
