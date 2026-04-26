using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.CreateBooking;

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, Result<Guid>>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateBookingCommandHandler> _logger;

    public CreateBookingCommandHandler(
        IBookingRepository bookingRepository,
        IUserRepository userRepository,
        IApplicationDbContext context,
        ILogger<CreateBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _userRepository = userRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            return Result<Guid>.Failure("User not found");
        }

        var timeSlot = await _context.TimeSlots.FindAsync(new object[] { request.TimeSlotId }, cancellationToken);
        if (timeSlot == null)
        {
            return Result<Guid>.Failure("Time slot not found");
        }

        if (!timeSlot.IsActive)
        {
            return Result<Guid>.Failure("Time slot is not active");
        }

        var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(
            request.TimeSlotId,
            request.BookingDate,
            cancellationToken
        );

        if (!isAvailable)
        {
            return Result<Guid>.Failure("Time slot is not available for the selected date");
        }

        var depositAmount = timeSlot.CalculateDepositAmount();

        var booking = Booking.Create(
            request.UserId,
            request.TimeSlotId,
            request.BookingDate,
            timeSlot.Price,
            depositAmount
        );

        await _bookingRepository.AddAsync(booking, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Booking {BookingId} created for user {UserId} on {BookingDate}",
            booking.Id,
            request.UserId,
            request.BookingDate
        );

        return Result<Guid>.Success(booking.Id);
    }
}
