using Application.Common.Interfaces;
using Application.Common.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.ConfirmBooking;

public class ConfirmBookingCommandHandler : IRequestHandler<ConfirmBookingCommand, Result>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ConfirmBookingCommandHandler> _logger;

    public ConfirmBookingCommandHandler(
        IBookingRepository bookingRepository,
        IApplicationDbContext context,
        ILogger<ConfirmBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result> Handle(ConfirmBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetWithDetailsAsync(request.BookingId, cancellationToken);

        if (booking == null)
            return Result.Failure("Booking not found");

        if (booking.TimeSlot?.Pitch?.OwnerId != request.OwnerId)
            return Result.Failure("You are not authorized to confirm this booking");

        try
        {
            booking.Confirm();
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Booking {BookingId} confirmed by owner {OwnerId}",
                booking.Id,
                request.OwnerId
            );

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming booking {BookingId}", request.BookingId);
            return Result.Failure("Failed to confirm booking");
        }
    }
}
