using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Payments.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Commands.CreatePayment;

public class CreatePaymentCommandHandler : IRequestHandler<CreatePaymentCommand, Result<PaymentInitResult>>
{
    private readonly IPaymentGatewayResolver _paymentGatewayResolver;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreatePaymentCommandHandler> _logger;

    public CreatePaymentCommandHandler(
        IPaymentGatewayResolver paymentGatewayResolver,
        IApplicationDbContext context,
        ILogger<CreatePaymentCommandHandler> logger)
    {
        _paymentGatewayResolver = paymentGatewayResolver;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<PaymentInitResult>> Handle(
        CreatePaymentCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Get booking with deposit amount
        var booking = await _context.Bookings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
            return Result<PaymentInitResult>.Failure("Booking not found");

        // 2. Validate booking status
        if (booking.Status != Domain.Enums.BookingStatus.PendingDeposit)
            return Result<PaymentInitResult>.Failure("Booking is not in pending deposit status");

        // 3. Create payment URL
        var result = await CreateGatewayPaymentAsync(request, booking.DepositAmount.Amount, cancellationToken);

        if (!result.IsSuccess)
            return result;

        _logger.LogInformation(
            "Payment URL created for booking {BookingId}",
            request.BookingId
        );

        return result;
    }

    private Task<Result<PaymentInitResult>> CreateGatewayPaymentAsync(
        CreatePaymentCommand request,
        decimal amount,
        CancellationToken cancellationToken)
    {
        try
        {
            var gateway = _paymentGatewayResolver.Resolve(request.Provider);

            return gateway.CreatePaymentAsync(
                new PaymentGatewayCreateRequest(
                    request.BookingId,
                    amount,
                    request.ReturnUrl,
                    request.CallbackUrl ?? string.Empty,
                    request.IpAddress),
                cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return Task.FromResult(Result<PaymentInitResult>.Failure(ex.Message));
        }
    }
}
