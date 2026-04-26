using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class PaymentTransaction : BaseEntity
{
    private PaymentTransaction() { } // EF Core constructor

    private PaymentTransaction(Guid bookingId, Money amount, string gateway)
    {
        BookingId = bookingId;
        Amount = amount;
        Gateway = gateway;
        Status = PaymentStatus.Pending;
        TransactionDate = DateTime.UtcNow;
    }

    public Guid BookingId { get; private set; }
    public Money Amount { get; private set; } = null!;
    public string Gateway { get; private set; } = string.Empty;
    public string? ProviderTxnId { get; private set; }
    public PaymentStatus Status { get; private set; }
    public DateTime TransactionDate { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string? FailureReason { get; private set; }
    public string? RefundReason { get; private set; }
    public DateTime? RefundedAt { get; private set; }

    public Booking Booking { get; private set; } = null!;

    public static PaymentTransaction Create(Guid bookingId, Money amount, string gateway)
    {
        if (bookingId == Guid.Empty)
            throw new DomainException("Booking ID is required");

        if (amount.Amount <= 0)
            throw new DomainException("Amount must be greater than zero");

        if (string.IsNullOrWhiteSpace(gateway))
            throw new DomainException("Payment gateway is required");

        return new PaymentTransaction(bookingId, amount, gateway);
    }

    public void MarkAsProcessing(string providerTxnId)
    {
        if (Status != PaymentStatus.Pending)
            throw new DomainException($"Cannot mark as processing transaction with status {Status}");

        if (string.IsNullOrWhiteSpace(providerTxnId))
            throw new DomainException("Provider transaction ID is required");

        Status = PaymentStatus.Processing;
        ProviderTxnId = providerTxnId;
        MarkAsUpdated();
    }

    public void MarkAsSuccess()
    {
        if (Status != PaymentStatus.Processing && Status != PaymentStatus.Pending)
            throw new DomainException($"Cannot mark as success transaction with status {Status}");

        Status = PaymentStatus.Success;
        CompletedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void MarkAsFailed(string reason)
    {
        if (Status == PaymentStatus.Success)
            throw new DomainException("Cannot mark successful transaction as failed");

        if (Status == PaymentStatus.Refunded)
            throw new DomainException("Cannot mark refunded transaction as failed");

        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException("Failure reason is required");

        Status = PaymentStatus.Failed;
        FailureReason = reason;
        CompletedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void Refund(string reason)
    {
        if (Status != PaymentStatus.Success)
            throw new DomainException("Only successful transactions can be refunded");

        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException("Refund reason is required");

        Status = PaymentStatus.Refunded;
        RefundReason = reason;
        RefundedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public bool IsSuccessful() => Status == PaymentStatus.Success;
    public bool IsPending() => Status == PaymentStatus.Pending || Status == PaymentStatus.Processing;
    public bool IsFailed() => Status == PaymentStatus.Failed;
    public bool IsRefunded() => Status == PaymentStatus.Refunded;
}
