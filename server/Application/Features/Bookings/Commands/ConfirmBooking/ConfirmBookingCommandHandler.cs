using Application.Common.Interfaces;
using Application.Common.DTOs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.ConfirmBooking;

public class ConfirmBookingCommandHandler : IRequestHandler<ConfirmBookingCommand, Result>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ConfirmBookingCommandHandler> _logger;

    public ConfirmBookingCommandHandler(
        IBookingRepository bookingRepository,
        IUserRepository userRepository,
        IApplicationDbContext context,
        ILogger<ConfirmBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _userRepository = userRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result> Handle(ConfirmBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetTrackedWithDetailsAsync(request.BookingId, cancellationToken);

        if (booking == null)
            return Result.Failure("Booking not found");

        var requester = await _userRepository.GetByIdAsync(request.RequesterId, cancellationToken);
        if (requester == null)
            return Result.Failure("User not found");

        var pitchOwnerId = booking.TimeSlot?.Pitch?.OwnerId;
        if (pitchOwnerId == null)
            return Result.Failure("Pitch owner not found");

        var isAuthorized = requester.Id == pitchOwnerId
            || requester.IsAdmin()
            || (requester.IsPitchStaff() && requester.OwnerId == pitchOwnerId);

        if (!isAuthorized)
            return Result.Failure("You are not authorized to confirm this booking");

        try
        {
            booking.Confirm();
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Booking {BookingId} confirmed by owner {OwnerId}",
                booking.Id,
                pitchOwnerId
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
