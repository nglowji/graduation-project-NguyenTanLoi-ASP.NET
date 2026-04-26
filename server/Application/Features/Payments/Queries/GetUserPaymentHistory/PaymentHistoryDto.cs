namespace Application.Features.Payments.Queries.GetUserPaymentHistory;

public record PaymentHistoryDto(
    Guid TransactionId,
    Guid BookingId,
    string PitchName,
    DateTime BookingDate,
    string TimeSlot,
    decimal Amount,
    string Currency,
    string Gateway,
    string Status,
    string? ProviderTxnId,
    DateTime TransactionDate
);
