using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;

namespace Domain.Entities;

public class WaitlistEntry : BaseEntity, IAggregateRoot
{
    private WaitlistEntry() { } // EF Core constructor

    private WaitlistEntry(Guid userId, Guid timeSlotId, DateOnly bookingDate)
    {
        UserId = userId;
        TimeSlotId = timeSlotId;
        BookingDate = bookingDate;
        Status = WaitlistStatus.Waiting;
    }

    public Guid UserId { get; private set; }
    public Guid TimeSlotId { get; private set; }
    public DateOnly BookingDate { get; private set; }
    public WaitlistStatus Status { get; private set; }
    public DateTime? NotifiedAt { get; private set; }

    public User User { get; private set; } = null!;
    public TimeSlot TimeSlot { get; private set; } = null!;

    public static WaitlistEntry Create(Guid userId, Guid timeSlotId, DateOnly bookingDate)
    {
        if (userId == Guid.Empty)
            throw new DomainException("User ID is required");

        if (timeSlotId == Guid.Empty)
            throw new DomainException("Time slot ID is required");

        if (bookingDate < DateOnly.FromDateTime(DateTime.UtcNow))
            throw new DomainException("Cannot join waitlist for past dates");

        return new WaitlistEntry(userId, timeSlotId, bookingDate);
    }

    public void MarkAsNotified()
    {
        if (Status != WaitlistStatus.Waiting)
            throw new DomainException($"Cannot notify waitlist entry with status {Status}");

        Status = WaitlistStatus.Notified;
        NotifiedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void MarkAsConverted()
    {
        Status = WaitlistStatus.Converted;
        MarkAsUpdated();
    }

    public void Cancel()
    {
        if (Status == WaitlistStatus.Converted)
            throw new DomainException("Cannot cancel a converted waitlist entry");

        Status = WaitlistStatus.Cancelled;
        MarkAsUpdated();
    }

    public void Expire()
    {
        if (Status == WaitlistStatus.Waiting)
        {
            Status = WaitlistStatus.Expired;
            MarkAsUpdated();
        }
    }
}
