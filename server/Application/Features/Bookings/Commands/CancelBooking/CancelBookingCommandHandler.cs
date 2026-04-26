using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Common.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.CancelBooking;

public class CancelBookingCommandHandler : IRequestHandler<CancelBookingCommand, Result>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CancelBookingCommandHandler> _logger;

    public CancelBookingCommandHandler(
        IBookingRepository bookingRepository,
        IApplicationDbContext context,
        ILogger<CancelBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);

        if (booking == null)
        {
            return Result.Failure("Booking not found");
        }

        if (booking.UserId != request.UserId)
        {
            return Result.Failure("You are not authorized to cancel this booking");
        }

        if (!booking.CanBeCancelled())
        {
            return Result.Failure($"Cannot cancel booking with status {booking.Status}");
        }

        try
        {
            booking.Cancel(request.Reason);
            await _context.SaveChangesAsync(cancellationToken);

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
            _logger.LogError(ex, "Error cancelling booking {BookingId}", request.BookingId);
            return Result.Failure("Failed to cancel booking");
        }
    }
}
