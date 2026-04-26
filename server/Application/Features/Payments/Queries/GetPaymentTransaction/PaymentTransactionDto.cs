namespace Application.Features.Payments.Queries.GetPaymentTransaction;

public record PaymentTransactionDto(
    Guid Id,
    Guid BookingId,
    decimal Amount,
    string Currency,
    string Gateway,
    string Status,
    string? ProviderTxnId,
    string? FailureReason,
    string? RefundReason,
    DateTime TransactionDate,
    DateTime? UpdatedAt
);
