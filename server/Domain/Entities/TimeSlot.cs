using Domain.Common;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class TimeSlot : BaseEntity
{
    private readonly List<Booking> _bookings = new();

    private TimeSlot() { } // EF Core constructor

    private TimeSlot(Guid pitchId, TimeRange timeRange, Money price)
    {
        PitchId = pitchId;
        TimeRange = timeRange;
        Price = price;
        IsActive = true;
    }

    public Guid PitchId { get; private set; }
    public TimeRange TimeRange { get; private set; } = null!;
    public Money Price { get; private set; } = null!;
    public bool IsActive { get; private set; }

    public Pitch Pitch { get; private set; } = null!;
    public IReadOnlyCollection<Booking> Bookings => _bookings.AsReadOnly();

    public static TimeSlot Create(Guid pitchId, TimeRange timeRange, Money price)
    {
        if (pitchId == Guid.Empty)
            throw new DomainException("Pitch ID is required");

        if (price.Amount <= 0)
            throw new DomainException("Price must be greater than zero");

        return new TimeSlot(pitchId, timeRange, price);
    }

    public void UpdatePrice(Money newPrice)
    {
        if (newPrice.Amount <= 0)
            throw new DomainException("Price must be greater than zero");

        if (newPrice.Currency != Price.Currency)
            throw new DomainException("Cannot change currency");

        Price = newPrice;
        MarkAsUpdated();
    }

    public void UpdateTimeRange(TimeRange newTimeRange)
    {
        TimeRange = newTimeRange;
        MarkAsUpdated();
    }

    public void Activate()
    {
        if (IsActive)
            throw new DomainException("Time slot is already active");

        IsActive = true;
        MarkAsUpdated();
    }

    public void Deactivate()
    {
        if (!IsActive)
            throw new DomainException("Time slot is already inactive");

        IsActive = false;
        MarkAsUpdated();
    }

    public bool IsAvailableOn(DateOnly date)
    {
        if (!IsActive)
            return false;

        if (date < DateOnly.FromDateTime(DateTime.UtcNow))
            return false;

        return !_bookings.Any(b => 
            b.BookingDate == date && 
            (b.Status == Enums.BookingStatus.Confirmed || b.Status == Enums.BookingStatus.PendingDeposit)
        );
    }

    public Money CalculateDepositAmount(decimal depositPercentage = 30m)
    {
        if (depositPercentage < 0 || depositPercentage > 100)
            throw new DomainException("Deposit percentage must be between 0 and 100");

        return Price.CalculatePercentage(depositPercentage);
    }
}
