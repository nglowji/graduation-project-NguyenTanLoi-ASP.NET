using Domain.Common;
using Domain.Exceptions;

namespace Domain.Entities;

/// <summary>
/// Temporary lock for time slot to prevent double booking during checkout process
/// </summary>
public class BookingLock : BaseEntity
{
    private const int DefaultLockDurationMinutes = 10;

    private BookingLock() { } // EF Core constructor

    private BookingLock(Guid timeSlotId, DateOnly bookingDate, Guid userId, int lockDurationMinutes)
    {
        TimeSlotId = timeSlotId;
        BookingDate = bookingDate;
        UserId = userId;
        LockedAt = DateTime.UtcNow;
        ExpiresAt = DateTime.UtcNow.AddMinutes(lockDurationMinutes);
    }

    public Guid TimeSlotId { get; private set; }
    public DateOnly BookingDate { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime LockedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public bool IsReleased { get; private set; }
    public DateTime? ReleasedAt { get; private set; }

    public static BookingLock Create(
        Guid timeSlotId, 
        DateOnly bookingDate, 
        Guid userId,
        int lockDurationMinutes = DefaultLockDurationMinutes)
    {
        if (timeSlotId == Guid.Empty)
            throw new DomainException("Time slot ID is required");

        if (userId == Guid.Empty)
            throw new DomainException("User ID is required");

        if (lockDurationMinutes <= 0)
            throw new DomainException("Lock duration must be positive");

        return new BookingLock(timeSlotId, bookingDate, userId, lockDurationMinutes);
    }

    public void Release()
    {
        if (IsReleased)
            throw new DomainException("Lock is already released");

        IsReleased = true;
        ReleasedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public bool IsExpired() => DateTime.UtcNow > ExpiresAt;

    public bool IsActive() => !IsReleased && !IsExpired();

    public void ExtendLock(int additionalMinutes)
    {
        if (IsReleased)
            throw new DomainException("Cannot extend released lock");

        if (additionalMinutes <= 0)
            throw new DomainException("Additional minutes must be positive");

        ExpiresAt = ExpiresAt.AddMinutes(additionalMinutes);
        MarkAsUpdated();
    }
}
