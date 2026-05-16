using Application.Common.Interfaces;

namespace Infrastructure.Services;

public class PaymentGatewayResolver : IPaymentGatewayResolver
{
    private readonly IReadOnlyDictionary<string, IPaymentGateway> _gateways;

    public PaymentGatewayResolver(IEnumerable<IPaymentGateway> gateways)
    {
        _gateways = gateways.ToDictionary(
            gateway => gateway.Provider,
            StringComparer.OrdinalIgnoreCase);
    }

    public IPaymentGateway Resolve(string provider)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new InvalidOperationException("Payment provider is required");

        if (_gateways.TryGetValue(provider.Trim(), out var gateway))
            return gateway;

        throw new InvalidOperationException($"Unsupported payment provider: {provider}");
    }
}
