using Application.Common.Interfaces;
using Application.Common.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Commands.ProcessCallback;

public class ProcessPaymentCallbackCommandHandler 
    : IRequestHandler<ProcessPaymentCallbackCommand, Result<PaymentCallbackResult>>
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<ProcessPaymentCallbackCommandHandler> _logger;

    public ProcessPaymentCallbackCommandHandler(
        IPaymentService paymentService,
        ILogger<ProcessPaymentCallbackCommandHandler> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    public async Task<Result<PaymentCallbackResult>> Handle(
        ProcessPaymentCallbackCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing payment callback");

        var result = await _paymentService.ProcessPaymentCallbackAsync(
            request.QueryParams,
            cancellationToken
        );

        if (result.IsSuccess && result.Value != null)
        {
            _logger.LogInformation(
                "Payment callback processed for booking {BookingId}, success: {IsSuccess}",
                result.Value.BookingId,
                result.Value.IsSuccess
            );
        }

        return result;
    }
}
