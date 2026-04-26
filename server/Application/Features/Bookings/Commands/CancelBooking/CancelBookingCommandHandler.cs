using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.CancelBooking;

public class CancelBookingCommandHandler : IRequestHandler<CancelBookingCommand, Result>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IPaymentService _paymentService;
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CancelBookingCommandHandler> _logger;
    private readonly BookingDomainService _bookingDomainService;

    public CancelBookingCommandHandler(
        IBookingRepository bookingRepository,
        IPaymentService paymentService,
        IApplicationDbContext context,
        IConfiguration configuration,
        ILogger<CancelBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _paymentService = paymentService;
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _bookingDomainService = new BookingDomainService();
    }

    public async Task<Result> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetWithDetailsAsync(request.BookingId, cancellationToken);

        if (booking == null)
            return Result.Failure("Booking not found");

        if (booking.UserId != request.UserId)
            return Result.Failure("You are not authorized to cancel this booking");

        if (!booking.CanBeCancelled())
            return Result.Failure($"Cannot cancel booking with status {booking.Status}");

        // Get minimum cancellation hours from configuration
        var minimumCancellationHours = int.TryParse(
            _configuration["Booking:MinimumCancellationHours"], 
            out var hours) ? hours : 24;

        // Validate cancellation policy
        try
        {
            _bookingDomainService.ValidateCancellationPolicy(booking, minimumCancellationHours);
        }
        catch (Domain.Exceptions.DomainException ex)
        {
            return Result.Failure(ex.Message);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Cancel booking
            booking.Cancel(request.Reason);

            // Process refund if payment was made
            if (booking.Transaction != null && booking.Transaction.IsSuccessful())
            {
                var shouldRefund = _bookingDomainService.ShouldRefundDeposit(booking, minimumCancellationHours);

                if (shouldRefund)
                {
                    var refundAmount = _bookingDomainService.CalculateRefundAmount(booking, minimumCancellationHours);

                    var refundResult = await _paymentService.ProcessRefundAsync(
                        booking.Transaction.Id,
                        refundAmount,
                        $"Booking cancelled by user: {request.Reason}",
                        cancellationToken
                    );

                    if (!refundResult.IsSuccess)
                    {
                        _logger.LogWarning(
                            "Refund failed for booking {BookingId}, but booking will still be cancelled",
                            booking.Id
                        );
                    }
                }
                else
                {
                    _logger.LogInformation(
                        "No refund for booking {BookingId} - cancelled within minimum cancellation period",
                        booking.Id
                    );
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Booking {BookingId} cancelled by user {UserId}. Reason: {Reason}",
                booking.Id,
                request.UserId,
                request.Reason
            );

            return Result.Success();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Error cancelling booking {BookingId}", request.BookingId);
            return Result.Failure("Failed to cancel booking");
        }
    }
}
