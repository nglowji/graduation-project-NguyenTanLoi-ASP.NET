using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class TimeSlot : BaseEntity
{
    private const decimal DefaultDepositPercentage = 30m;
    private const decimal MinDepositPercentage = 0m;
    private const decimal MaxDepositPercentage = 100m;

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
        ValidateCreationParameters(pitchId, price);
        return new TimeSlot(pitchId, timeRange, price);
    }

    public void UpdatePrice(Money newPrice)
    {
        ValidatePrice(newPrice);
        EnsureSameCurrency(newPrice);

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
        if (!IsActive || IsPastDate(date))
            return false;

        return !HasActiveBookingOn(date);
    }

    public Money CalculateDepositAmount(decimal depositPercentage = DefaultDepositPercentage)
    {
        ValidateDepositPercentage(depositPercentage);
        return Price.CalculatePercentage(depositPercentage);
    }

    private static void ValidateCreationParameters(Guid pitchId, Money price)
    {
        if (pitchId == Guid.Empty)
            throw new DomainException("Pitch ID is required");

        ValidatePrice(price);
    }

    private static void ValidatePrice(Money price)
    {
        if (!price.IsPositive)
            throw new DomainException("Price must be greater than zero");
    }

    private static void ValidateDepositPercentage(decimal percentage)
    {
        if (percentage < MinDepositPercentage || percentage > MaxDepositPercentage)
            throw new DomainException($"Deposit percentage must be between {MinDepositPercentage} and {MaxDepositPercentage}");
    }

    private void EnsureSameCurrency(Money newPrice)
    {
        if (newPrice.Currency != Price.Currency)
            throw new DomainException("Cannot change currency");
    }

    private static bool IsPastDate(DateOnly date) => date < DateOnly.FromDateTime(DateTime.UtcNow);

    private bool HasActiveBookingOn(DateOnly date) =>
        _bookings.Any(b =>
            b.BookingDate == date &&
            b.Status is BookingStatus.Confirmed or BookingStatus.PendingDeposit
        );
}
