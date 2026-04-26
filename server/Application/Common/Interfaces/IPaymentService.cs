using Application.Common.Models;

namespace Application.Common.Interfaces;

public interface IPaymentService
{
    /// <summary>
    /// Create payment URL for VNPAY
    /// </summary>
    Task<Result<string>> CreatePaymentUrlAsync(
        Guid bookingId,
        decimal amount,
        string returnUrl,
        string ipAddress,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Verify and process payment callback from VNPAY
    /// </summary>
    Task<Result<PaymentCallbackResult>> ProcessPaymentCallbackAsync(
        Dictionary<string, string> queryParams,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Process refund for cancelled booking
    /// </summary>
    Task<Result> ProcessRefundAsync(
        Guid transactionId,
        decimal amount,
        string reason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Query payment status from VNPAY
    /// </summary>
    Task<Result<PaymentStatusResult>> QueryPaymentStatusAsync(
        string providerTxnId,
        CancellationToken cancellationToken = default);
}

public record PaymentCallbackResult(
    Guid BookingId,
    Guid TransactionId,
    bool IsSuccess,
    string Message,
    string? ProviderTxnId
);

public record PaymentStatusResult(
    string Status,
    decimal Amount,
    string? Message
);
