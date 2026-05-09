using Application.Common.Interfaces;
using Application.Common.DTOs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Commands.ProcessCallback;

public class ProcessPaymentCallbackCommandHandler 
    : IRequestHandler<ProcessPaymentCallbackCommand, Result<PaymentCallbackResult>>
{
    private readonly IPaymentService _paymentService;
    private readonly IBookingRepository _bookingRepository;
    private readonly IPublisher _publisher;
    private readonly ILogger<ProcessPaymentCallbackCommandHandler> _logger;

    public ProcessPaymentCallbackCommandHandler(
        IPaymentService paymentService,
        IBookingRepository bookingRepository,
        IPublisher publisher,
        ILogger<ProcessPaymentCallbackCommandHandler> logger)
    {
        _paymentService = paymentService;
        _bookingRepository = bookingRepository;
        _publisher = publisher;
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

        if (result.IsSuccess && result.Value != null && result.Value.IsSuccess)
        {
            _logger.LogInformation(
                "Payment callback processed for booking {BookingId}, success: {IsSuccess}",
                result.Value.BookingId,
                result.Value.IsSuccess
            );

            // Fetch details for email notification
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
                    Amount: booking.TotalPrice.Amount
                ), cancellationToken);
            }
        }

        return result;
    }
}
