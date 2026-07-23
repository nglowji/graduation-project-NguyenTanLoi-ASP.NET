using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.Bookings.Commands.LockTimeSlot;

public sealed record BookingLockResult(
    Guid LockId,
    DateTime ExpiresAt,
    int DurationMinutes);

public record LockTimeSlotCommand(
    Guid UserId,
    Guid TimeSlotId,
    DateOnly BookingDate,
    int? LockDurationMinutes = null
) : IRequest<Result<BookingLockResult>>, ITransactionalRequest;
