using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.CreateBooking;

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, Result<Guid>>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBookingLockRepository _lockRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateBookingCommandHandler> _logger;

    public CreateBookingCommandHandler(
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IUserRepository userRepository,
        IBookingLockRepository lockRepository,
        IApplicationDbContext context,
        ILogger<CreateBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
        _userRepository = userRepository;
        _lockRepository = lockRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        // Use execution strategy for retry logic
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable,
                cancellationToken
            );

            try
            {
                // 1. Verify user exists
                var userExists = await _userRepository.ExistsAsync(request.UserId, cancellationToken);
                if (!userExists)
                    return Result<Guid>.Failure("User not found");

                // 2. Verify time slot exists and is active
                var timeSlot = await _timeSlotRepository.GetByIdAsync(request.TimeSlotId, cancellationToken);
                if (timeSlot == null)
                    return Result<Guid>.Failure("Time slot not found");

                if (!timeSlot.IsActive)
                    return Result<Guid>.Failure("Time slot is not active");

                // 3. Check for active lock by this user
                var userLock = await _lockRepository.GetUserLockAsync(
                    request.TimeSlotId,
                    request.BookingDate,
                    request.UserId,
                    cancellationToken
                );

                if (userLock == null || !userLock.IsActive())
                {
                    return Result<Guid>.Failure(
                        "No active lock found. Please lock the time slot first before booking."
                    );
                }

                // 4. Double-check availability (race condition protection)
                var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(
                    request.TimeSlotId,
                    request.BookingDate,
                    cancellationToken
                );

                if (!isAvailable)
                {
                    // Release the lock since booking failed
                    userLock.Release();
                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);

                    return Result<Guid>.Failure("Time slot is no longer available");
                }

                // 5. Create booking
                var depositAmount = timeSlot.CalculateDepositAmount();
                var booking = Booking.Create(
                    request.UserId,
                    request.TimeSlotId,
                    request.BookingDate,
                    timeSlot.Price,
                    depositAmount
                );

                await _bookingRepository.AddAsync(booking, cancellationToken);

                // 6. Release the lock
                userLock.Release();

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation(
                    "Booking {BookingId} created for user {UserId} on {BookingDate} for time slot {TimeSlotId}",
                    booking.Id,
                    request.UserId,
                    request.BookingDate,
                    request.TimeSlotId
                );

                return Result<Guid>.Success(booking.Id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error creating booking");
                return Result<Guid>.Failure("Failed to create booking. Please try again.");
            }
        });
    }
}
