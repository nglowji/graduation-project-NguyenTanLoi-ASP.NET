using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Commands.ProcessZaloPayCallback;

public class ProcessZaloPayCallbackCommandHandler
    : IRequestHandler<ProcessZaloPayCallbackCommand, Result<PaymentCallbackResult>>
{
    private const string ProviderZaloPay = "ZALOPAY";

    private readonly IPaymentGatewayResolver _paymentGatewayResolver;
    private readonly IBookingRepository _bookingRepository;
    private readonly IPublisher _publisher;
    private readonly ILogger<ProcessZaloPayCallbackCommandHandler> _logger;

    public ProcessZaloPayCallbackCommandHandler(
        IPaymentGatewayResolver paymentGatewayResolver,
        IBookingRepository bookingRepository,
        IPublisher publisher,
        ILogger<ProcessZaloPayCallbackCommandHandler> logger)
    {
        _paymentGatewayResolver = paymentGatewayResolver;
        _bookingRepository = bookingRepository;
        _publisher = publisher;
        _logger = logger;
    }

    public async Task<Result<PaymentCallbackResult>> Handle(
        ProcessZaloPayCallbackCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing ZaloPay callback");

        var gateway = _paymentGatewayResolver.Resolve(ProviderZaloPay);
        var result = await gateway.ProcessCallbackAsync(
            new PaymentGatewayCallback(
                Data: request.Data,
                Mac: request.Mac,
                Type: request.Type),
            cancellationToken);

        if (result.IsSuccess && result.Value != null && result.Value.IsSuccess)
        {
            var booking = await _bookingRepository.GetWithDetailsAsync(result.Value.BookingId, cancellationToken);
            if (booking != null && booking.User != null)
            {
                await _publisher.Publish(new Notifications.PaymentSucceededNotification(
                    BookingId: booking.Id,
                    CustomerEmail: booking.User.Email,
                    CustomerName: booking.User.FullName,
                    PitchName: booking.TimeSlot.Pitch.Name,
                    BookingDate: booking.BookingDate.ToString("dd/MM/yyyy"),
                    TimeSlot: $"{booking.TimeSlot.TimeRange.StartTime:hh\\:mm} - {booking.TimeSlot.TimeRange.EndTime:hh\\:mm}",
                    Amount: booking.DepositAmount.Amount
                ), cancellationToken);
            }
        }

        return result;
    }
}
