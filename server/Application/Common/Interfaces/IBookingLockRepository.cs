using Domain.Entities;

namespace Application.Common.Interfaces;

public interface IBookingLockRepository
{
    Task<BookingLock?> GetActiveLockAsync(
        Guid timeSlotId, 
        DateOnly bookingDate,
        CancellationToken cancellationToken = default);

    Task<BookingLock?> GetUserLockAsync(
        Guid timeSlotId,
        DateOnly bookingDate,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<BookingLock> AddAsync(
        BookingLock bookingLock,
        CancellationToken cancellationToken = default);

    Task UpdateAsync(
        BookingLock bookingLock,
        CancellationToken cancellationToken = default);

    Task<int> CleanupExpiredLocksAsync(CancellationToken cancellationToken = default);
}
