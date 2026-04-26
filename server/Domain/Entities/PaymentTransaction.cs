using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class PaymentTransaction : BaseEntity
{
    private const int MaxGatewayNameLength = 50;
    private const int MaxProviderTxnIdLength = 200;
    private const int MaxReasonLength = 500;

    private static readonly PaymentStatus[] ProcessableStatuses = { PaymentStatus.Pending, PaymentStatus.Processing };
    private static readonly PaymentStatus[] FailableStatuses = { PaymentStatus.Pending, PaymentStatus.Processing };

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
        ValidateCreationParameters(bookingId, amount, gateway);
        return new PaymentTransaction(bookingId, amount, gateway);
    }

    public void MarkAsProcessing(string providerTxnId)
    {
        EnsureStatusIs(PaymentStatus.Pending, "mark as processing");
        ValidateProviderTxnId(providerTxnId);

        Status = PaymentStatus.Processing;
        ProviderTxnId = providerTxnId;
        MarkAsUpdated();
    }

    public void MarkAsSuccess()
    {
        EnsureStatusIsOneOf(ProcessableStatuses, "mark as success");

        Status = PaymentStatus.Success;
        CompletedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void MarkAsFailed(string reason)
    {
        EnsureStatusIsOneOf(FailableStatuses, "mark as failed");
        ValidateReason(reason, "Failure reason");

        Status = PaymentStatus.Failed;
        FailureReason = reason;
        CompletedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void Refund(string reason)
    {
        EnsureStatusIs(PaymentStatus.Success, "refund");
        ValidateReason(reason, "Refund reason");

        Status = PaymentStatus.Refunded;
        RefundReason = reason;
        RefundedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public bool IsSuccessful() => Status == PaymentStatus.Success;
    public bool IsPending() => Status is PaymentStatus.Pending or PaymentStatus.Processing;
    public bool IsFailed() => Status == PaymentStatus.Failed;
    public bool IsRefunded() => Status == PaymentStatus.Refunded;

    private static void ValidateCreationParameters(Guid bookingId, Money amount, string gateway)
    {
        if (bookingId == Guid.Empty)
            throw new DomainException("Booking ID is required");

        if (!amount.IsPositive)
            throw new DomainException("Amount must be greater than zero");

        if (string.IsNullOrWhiteSpace(gateway))
            throw new DomainException("Payment gateway is required");

        if (gateway.Length > MaxGatewayNameLength)
            throw new DomainException($"Gateway name cannot exceed {MaxGatewayNameLength} characters");
    }

    private static void ValidateProviderTxnId(string providerTxnId)
    {
        if (string.IsNullOrWhiteSpace(providerTxnId))
            throw new DomainException("Provider transaction ID is required");

        if (providerTxnId.Length > MaxProviderTxnIdLength)
            throw new DomainException($"Provider transaction ID cannot exceed {MaxProviderTxnIdLength} characters");
    }

    private static void ValidateReason(string reason, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException($"{fieldName} is required");

        if (reason.Length > MaxReasonLength)
            throw new DomainException($"{fieldName} cannot exceed {MaxReasonLength} characters");
    }

    private void EnsureStatusIs(PaymentStatus expectedStatus, string operation)
    {
        if (Status != expectedStatus)
            throw new DomainException($"Cannot {operation} transaction with status {Status}");
    }

    private void EnsureStatusIsOneOf(PaymentStatus[] allowedStatuses, string operation)
    {
        if (!allowedStatuses.Contains(Status))
            throw new DomainException($"Cannot {operation} transaction with status {Status}");
    }
}
