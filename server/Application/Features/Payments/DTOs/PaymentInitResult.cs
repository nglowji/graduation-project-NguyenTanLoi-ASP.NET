namespace Application.Features.Payments.DTOs;

public record PaymentInitResult(
    Guid TransactionId,
    string Provider,
    string PaymentUrl,
    string? QrCode
);
