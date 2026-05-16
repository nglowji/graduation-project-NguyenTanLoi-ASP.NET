using Application.Common.DTOs;
using Application.Features.Payments.DTOs;

namespace Application.Common.Interfaces;

public interface IPaymentGateway
{
    string Provider { get; }

    Task<Result<PaymentInitResult>> CreatePaymentAsync(
        PaymentGatewayCreateRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<PaymentCallbackResult>> ProcessCallbackAsync(
        PaymentGatewayCallback callback,
        CancellationToken cancellationToken = default);

    Task<Result> SynchronizePaymentAsync(
        Guid transactionId,
        CancellationToken cancellationToken = default);
}

public interface IPaymentGatewayResolver
{
    IPaymentGateway Resolve(string provider);
}

public record PaymentGatewayCreateRequest(
    Guid BookingId,
    decimal Amount,
    string ReturnUrl,
    string CallbackUrl,
    string IpAddress
);

public record PaymentGatewayCallback(
    Dictionary<string, string>? QueryParams = null,
    string? Data = null,
    string? Mac = null,
    int? Type = null
);
