using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class Booking : BaseEntity, IAggregateRoot
{
    private const decimal MinimumDepositPercentage = 30m;
    private static readonly BookingStatus[] CancellableStatuses = { BookingStatus.PendingDeposit, BookingStatus.Confirmed };
    
    private Booking() { } // EF Core constructor

    private Booking(Guid userId, Guid timeSlotId, DateOnly bookingDate, Money totalPrice, Money depositAmount)
    {
        UserId = userId;
        TimeSlotId = timeSlotId;
        BookingDate = bookingDate;
        TotalPrice = totalPrice;
        DepositAmount = depositAmount;
        Status = BookingStatus.PendingDeposit;
    }

    public Guid UserId { get; private set; }
    public Guid TimeSlotId { get; private set; }
    public DateOnly BookingDate { get; private set; }
    public Money TotalPrice { get; private set; } = null!;
    public Money DepositAmount { get; private set; } = null!;
    public BookingStatus Status { get; private set; }
    public string? CancellationReason { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    public TimeSlot TimeSlot { get; private set; } = null!;
    public PaymentTransaction? Transaction { get; private set; }

    public static Booking Create(Guid userId, Guid timeSlotId, DateOnly bookingDate, Money totalPrice, Money depositAmount)
    {
        ValidateCreationParameters(userId, timeSlotId, bookingDate, totalPrice, depositAmount);
        return new Booking(userId, timeSlotId, bookingDate, totalPrice, depositAmount);
    }

    public void Confirm()
    {
        EnsureStatusIs(BookingStatus.PendingDeposit, "confirm");
        Status = BookingStatus.Confirmed;
        MarkAsUpdated();
    }

    public void Cancel(string reason)
    {
        EnsureCanBeCancelled();
        ValidateCancellationReason(reason);
        
        Status = BookingStatus.Cancelled;
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void Complete()
    {
        EnsureStatusIs(BookingStatus.Confirmed, "complete");
        EnsureIsNotFutureBooking();
        
        Status = BookingStatus.Completed;
        MarkAsUpdated();
    }

    public void MarkAsNoShow()
    {
        EnsureStatusIs(BookingStatus.Confirmed, "mark as no-show");
        EnsureIsPastBooking();
        
        Status = BookingStatus.NoShow;
        MarkAsUpdated();
    }

    public Money CalculateRemainingAmount() => TotalPrice.Subtract(DepositAmount);

    public bool CanBeCancelled() => CancellableStatuses.Contains(Status);

    public bool IsUpcoming() => BookingDate >= GetToday() && CancellableStatuses.Contains(Status);

    public bool IsPast() => BookingDate < GetToday();

    private static void ValidateCreationParameters(Guid userId, Guid timeSlotId, DateOnly bookingDate, Money totalPrice, Money depositAmount)
    {
        if (userId == Guid.Empty)
            throw new DomainException("User ID is required");

        if (timeSlotId == Guid.Empty)
            throw new DomainException("Time slot ID is required");

        if (bookingDate < GetToday())
            throw new DomainException("Cannot book for past dates");

        if (!totalPrice.IsPositive)
            throw new DomainException("Total price must be greater than zero");

        if (!depositAmount.IsPositive)
            throw new DomainException("Deposit amount must be greater than zero");

        var minimumDeposit = totalPrice.CalculatePercentage(MinimumDepositPercentage);
        if (!depositAmount.IsGreaterThanOrEqual(minimumDeposit))
            throw new DomainException($"Deposit amount must be at least {MinimumDepositPercentage}% of total price");

        if (depositAmount.IsGreaterThan(totalPrice))
            throw new DomainException("Deposit amount cannot exceed total price");
    }

    private void EnsureStatusIs(BookingStatus expectedStatus, string operation)
    {
        if (Status != expectedStatus)
            throw new DomainException($"Cannot {operation} booking with status {Status}");
    }

    private void EnsureCanBeCancelled()
    {
        if (Status == BookingStatus.Completed)
            throw new DomainException("Cannot cancel completed booking");

        if (Status == BookingStatus.Cancelled)
            throw new DomainException("Booking is already cancelled");
    }

    private static void ValidateCancellationReason(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException("Cancellation reason is required");
    }

    private void EnsureIsNotFutureBooking()
    {
        if (BookingDate > GetToday())
            throw new DomainException("Cannot complete future booking");
    }

    private void EnsureIsPastBooking()
    {
        if (BookingDate >= GetToday())
            throw new DomainException("Cannot mark future booking as no-show");
    }

    private static DateOnly GetToday() => DateOnly.FromDateTime(DateTime.UtcNow);
}
