using Application.Common.Interfaces;
using Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.ReleaseLock;

public class ReleaseLockCommandHandler : IRequestHandler<ReleaseLockCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IBookingNotificationService _notificationService;
    private readonly ILogger<ReleaseLockCommandHandler> _logger;

    public ReleaseLockCommandHandler(
        IApplicationDbContext context,
        IBookingNotificationService notificationService,
        ILogger<ReleaseLockCommandHandler> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result> Handle(ReleaseLockCommand request, CancellationToken cancellationToken)
    {
        var bookingLock = await _context.BookingLocks
            .Include(bl => bl.TimeSlot)
            .FirstOrDefaultAsync(bl => bl.Id == request.LockId, cancellationToken);

        if (bookingLock == null)
            return Result.Failure("Lock not found");

        if (bookingLock.UserId != request.UserId)
            return Result.Failure("You are not authorized to release this lock");

        if (bookingLock.IsReleased)
            return Result.Success(); // Already released, idempotent

        try
        {
            bookingLock.Release();
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Lock {LockId} released by user {UserId}",
                request.LockId,
                request.UserId
            );

            // Notify real-time status update
            if (bookingLock.TimeSlot != null)
            {
                await _notificationService.NotifyTimeSlotStatusChangedAsync(
                    bookingLock.TimeSlot.PitchId,
                    bookingLock.TimeSlotId,
                    "Available",
                    bookingLock.BookingDate,
                    cancellationToken
                );
            }

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error releasing lock {LockId}", request.LockId);
            return Result.Failure("Failed to release lock");
        }
    }
}
