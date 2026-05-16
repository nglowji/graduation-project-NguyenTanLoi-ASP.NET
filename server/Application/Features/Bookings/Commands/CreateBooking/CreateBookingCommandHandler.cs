using System.Globalization;
using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Bookings.Events;
using Domain.Entities;
using Domain.Exceptions;
using Domain.Services;
using Domain.ValueObjects;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Bookings.Commands.CreateBooking;

/// <summary>
/// Handles booking creation with lock verification and dynamic pricing.
/// Side effects (email, cache, real-time) are handled by notification handlers.
/// </summary>
public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, Result<Guid>>
{
    private const string DefaultDepositPercentage = "10";

    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBookingLockRepository _lockRepository;
    private readonly IApplicationDbContext _context;
    private readonly ISystemConfigurationRepository _systemConfigRepository;
    private readonly PricingDomainService _pricingService;
    private readonly IMediator _mediator;
    private readonly ILogger<CreateBookingCommandHandler> _logger;

    private sealed record BookingPreconditions(TimeSlot TimeSlot, BookingLock UserLock);
    private sealed record SelectedAdditionalService(Guid Id, string Name, Money Price, int Quantity);

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
            var preconditionsResult = await ValidatePreconditionsAsync(request, cancellationToken);
            if (!preconditionsResult.IsSuccess)
                return Result<Guid>.Failure(preconditionsResult.ErrorMessage!);

            var (timeSlot, userLock) = preconditionsResult.Value!;

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
        catch (DomainException ex)
        {
            _logger.LogWarning(ex, "Booking rule rejected for user {UserId}", request.UserId);
            return Result<Guid>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking for user {UserId}", request.UserId);
            return Result<Guid>.Failure("Failed to create booking. Please try again.");
        }
    }

    private async Task<Result<BookingPreconditions>> ValidatePreconditionsAsync(
        CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var userExists = await _userRepository.ExistsAsync(request.UserId, cancellationToken);
        if (!userExists)
            return Result<BookingPreconditions>.Failure("User not found");

        var timeSlot = await _timeSlotRepository.GetByIdAsync(request.TimeSlotId, cancellationToken);
        if (timeSlot == null)
            return Result<BookingPreconditions>.Failure("Time slot not found");

        if (!timeSlot.IsActive)
            return Result<BookingPreconditions>.Failure("Time slot is not active");

        var userLock = await _lockRepository.GetUserLockAsync(
            request.TimeSlotId, request.BookingDate, request.UserId, cancellationToken);

        if (userLock == null || !userLock.IsActive())
            return Result<BookingPreconditions>.Failure("No active lock found. Please lock the time slot first.");

        return Result<BookingPreconditions>.Success(new BookingPreconditions(timeSlot, userLock));
    }

    private async Task<Booking> CreateBookingAsync(
        CreateBookingCommand request, TimeSlot timeSlot, CancellationToken cancellationToken)
    {
        var servicesToAttach = await GetSelectedServicesAsync(request, cancellationToken);
        var depositPercent = await GetDepositPercentageAsync(cancellationToken);
        var bookingPrice = _pricingService.CalculateBookingPrice(
            timeSlot,
            request.BookingDate,
            servicesToAttach.Select(s => new BookingServicePricing(s.Price, s.Quantity)),
            depositPercent);

        var booking = Booking.Create(
            request.UserId, request.TimeSlotId, request.BookingDate,
            bookingPrice.TotalPrice, bookingPrice.DepositAmount);

        // Add services to booking
        foreach (var service in servicesToAttach)
        {
            booking.AddService(service.Id, service.Name, service.Price, service.Quantity);
        }

        await _bookingRepository.AddAsync(booking, cancellationToken);
        return booking;
    }

    private async Task<List<SelectedAdditionalService>> GetSelectedServicesAsync(
        CreateBookingCommand request,
        CancellationToken cancellationToken)
    {
        if (request.SelectedServices is null || request.SelectedServices.Count == 0)
            return [];

        var requestedQuantities = request.SelectedServices
            .GroupBy(service => service.ServiceId)
            .ToDictionary(group => group.Key, group => group.Sum(service => service.Quantity));

        var serviceIds = requestedQuantities.Keys.ToList();
        var additionalServices = await _context.AdditionalServices
            .AsNoTracking()
            .Where(service => serviceIds.Contains(service.Id) && service.IsActive)
            .ToListAsync(cancellationToken);

        if (additionalServices.Count != requestedQuantities.Count)
            throw new DomainException("One or more selected services are unavailable");

        return additionalServices
            .Select(service => new SelectedAdditionalService(
                service.Id,
                service.Name,
                service.Price,
                requestedQuantities[service.Id]))
            .ToList();
    }

    private async Task<decimal> GetDepositPercentageAsync(CancellationToken cancellationToken)
    {
        var depositPercentText = await _systemConfigRepository.GetValueAsync(
            SystemConfiguration.Keys.DepositPercentage, DefaultDepositPercentage, cancellationToken);

        if (!decimal.TryParse(
                depositPercentText,
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out var depositPercent))
        {
            throw new DomainException("Invalid deposit percentage configuration");
        }

        return depositPercent;
    }
}
