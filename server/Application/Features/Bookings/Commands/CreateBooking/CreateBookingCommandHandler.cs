using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Bookings.Events;
using Domain.Entities;
using Domain.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.CreateBooking;

/// <summary>
/// Handles booking creation with lock verification and dynamic pricing.
/// Side effects (email, cache, real-time) are handled by notification handlers.
/// </summary>
public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, Result<Guid>>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBookingLockRepository _lockRepository;
    private readonly IApplicationDbContext _context;
    private readonly ISystemConfigurationRepository _systemConfigRepository;
    private readonly PricingDomainService _pricingService;
    private readonly IMediator _mediator;
    private readonly ILogger<CreateBookingCommandHandler> _logger;

    public CreateBookingCommandHandler(
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IUserRepository userRepository,
        IBookingLockRepository lockRepository,
        IApplicationDbContext context,
        ISystemConfigurationRepository systemConfigRepository,
        PricingDomainService pricingService,
        IMediator mediator,
        ILogger<CreateBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
        _userRepository = userRepository;
        _lockRepository = lockRepository;
        _context = context;
        _systemConfigRepository = systemConfigRepository;
        _pricingService = pricingService;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Validate preconditions
            var validationResult = await ValidatePreconditionsAsync(request, cancellationToken);
            if (!validationResult.IsSuccess)
                return validationResult;

            var timeSlot = (await _timeSlotRepository.GetByIdAsync(request.TimeSlotId, cancellationToken))!;
            var userLock = (await _lockRepository.GetUserLockAsync(
                request.TimeSlotId, request.BookingDate, request.UserId, cancellationToken))!;

            // 2. Double-check availability (race condition protection)
            var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(
                request.TimeSlotId, request.BookingDate, cancellationToken);

            if (!isAvailable)
            {
                userLock.Release();
                await _context.SaveChangesAsync(cancellationToken);
                return Result<Guid>.Failure("Time slot is no longer available");
            }

            // 3. Create booking with dynamic pricing
            var booking = await CreateBookingAsync(request, timeSlot, cancellationToken);

            // 4. Release lock and persist
            userLock.Release();
            await _context.SaveChangesAsync(cancellationToken);

            // 5. Publish side effects (email, cache, real-time) — non-blocking
            await _mediator.Publish(new BookingCreatedNotification(
                booking.Id, request.UserId, timeSlot.PitchId,
                request.TimeSlotId, request.BookingDate
            ), cancellationToken);

            _logger.LogInformation(
                "Booking {BookingId} created for user {UserId} on {BookingDate}",
                booking.Id, request.UserId, request.BookingDate);

            return Result<Guid>.Success(booking.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking for user {UserId}", request.UserId);
            return Result<Guid>.Failure("Failed to create booking. Please try again.");
        }
    }

    private async Task<Result<Guid>> ValidatePreconditionsAsync(
        CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var userExists = await _userRepository.ExistsAsync(request.UserId, cancellationToken);
        if (!userExists)
            return Result<Guid>.Failure("User not found");

        var timeSlot = await _timeSlotRepository.GetByIdAsync(request.TimeSlotId, cancellationToken);
        if (timeSlot == null)
            return Result<Guid>.Failure("Time slot not found");

        if (!timeSlot.IsActive)
            return Result<Guid>.Failure("Time slot is not active");

        var userLock = await _lockRepository.GetUserLockAsync(
            request.TimeSlotId, request.BookingDate, request.UserId, cancellationToken);

        if (userLock == null || !userLock.IsActive())
            return Result<Guid>.Failure("No active lock found. Please lock the time slot first.");

        return Result<Guid>.Success(Guid.Empty);
    }

    private async Task<Booking> CreateBookingAsync(
        CreateBookingCommand request, Domain.Entities.TimeSlot timeSlot, CancellationToken cancellationToken)
    {
        var effectivePrice = _pricingService.CalculateEffectivePrice(timeSlot, request.BookingDate);

        var depositPercentStr = await _systemConfigRepository.GetValueAsync(
            SystemConfiguration.Keys.DepositPercentage, "30", cancellationToken);

        var depositPercent = decimal.Parse(depositPercentStr);
        var depositAmount = effectivePrice.CalculatePercentage(depositPercent);

        var booking = Booking.Create(
            request.UserId, request.TimeSlotId, request.BookingDate,
            effectivePrice, depositAmount);

        await _bookingRepository.AddAsync(booking, cancellationToken);
        return booking;
    }
}
