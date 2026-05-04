using System.Runtime.CompilerServices;
using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class Booking : BaseEntity, IAggregateRoot
{
    private const decimal MinimumDepositPercentage = 30m;
    
    private Booking() { } // EF Core constructor

    private Booking(Guid userId, Guid timeSlotId, DateOnly bookingDate, Money totalPrice, Money depositAmount)
    {
        UserId = userId;
        TimeSlotId = timeSlotId;
        BookingDate = bookingDate;
        TotalPrice = totalPrice;
        DepositAmount = depositAmount;
        Status = BookingStatus.PendingDeposit;
        CheckInCode = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper(); // Simple 8-char code
    }

    public Guid UserId { get; private set; }
    public Guid TimeSlotId { get; private set; }
    public DateOnly BookingDate { get; private set; }
    public Money TotalPrice { get; private set; } = null!;
    public Money DepositAmount { get; private set; } = null!;
    public BookingStatus Status { get; private set; }
    public string? CancellationReason { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CheckInCode { get; private set; }

    public User User { get; private set; } = null!;
    public TimeSlot TimeSlot { get; private set; } = null!;
    public PaymentTransaction? Transaction { get; private set; }

    public static Booking Create(Guid userId, Guid timeSlotId, DateOnly bookingDate, Money totalPrice, Money depositAmount)
    {
        ValidateCreationParameters(userId, timeSlotId, bookingDate, totalPrice, depositAmount);
        return new Booking(userId, timeSlotId, bookingDate, totalPrice, depositAmount);
    }

    public void Confirm()
    {
        if (Status != BookingStatus.PendingDeposit)
            throw new DomainException($"Cannot confirm booking with status {Status}");
        
        Status = BookingStatus.Confirmed;
        MarkAsUpdated();
    }

    public void Cancel(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException("Cancellation reason is required");

        if (Status == BookingStatus.Completed)
            throw new DomainException("Cannot cancel completed booking");

        if (Status == BookingStatus.Cancelled)
            throw new DomainException("Booking is already cancelled");
        
        Status = BookingStatus.Cancelled;
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void Complete()
    {
        if (Status != BookingStatus.Confirmed)
            throw new DomainException($"Cannot complete booking with status {Status}");

        if (BookingDate > GetToday())
            throw new DomainException("Cannot complete future booking");
        
        Status = BookingStatus.Completed;
        MarkAsUpdated();
    }

    public void MarkAsNoShow()
    {
        if (Status != BookingStatus.Confirmed)
            throw new DomainException($"Cannot mark as no-show booking with status {Status}");

        if (BookingDate >= GetToday())
            throw new DomainException("Cannot mark future booking as no-show");
        
        Status = BookingStatus.NoShow;
        MarkAsUpdated();
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public Money CalculateRemainingAmount() => TotalPrice.Subtract(DepositAmount);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public bool CanBeCancelled() => Status is BookingStatus.PendingDeposit or BookingStatus.Confirmed;

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public bool IsUpcoming() => BookingDate >= GetToday() && CanBeCancelled();

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
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

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static DateOnly GetToday() => DateOnly.FromDateTime(DateTime.UtcNow);
}
