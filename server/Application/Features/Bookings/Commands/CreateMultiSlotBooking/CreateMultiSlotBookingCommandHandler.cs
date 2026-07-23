using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Bookings.Events;
using Domain.Entities;
using Domain.Enums;
using Domain.Exceptions;
using Domain.Services;
using Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.CreateMultiSlotBooking;

public class CreateMultiSlotBookingCommandHandler : IRequestHandler<CreateMultiSlotBookingCommand, Result<List<Guid>>>
{
    private const int MaxSlotsPerRequest = 10;
    private const decimal DefaultDepositPercentage = 10m;

    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBookingLockRepository _lockRepository;
    private readonly IApplicationDbContext _context;
    private readonly ISystemSettingService _settingService;
    private readonly IEmailService _emailService;
    private readonly PricingDomainService _pricingService;
    private readonly IMediator _mediator;
    private readonly ILogger<CreateMultiSlotBookingCommandHandler> _logger;

    private sealed record SelectedAdditionalService(AdditionalService Service, int Quantity)
    {
        public Guid Id => Service.Id;
        public string Name => Service.Name;
        public Money Price => Service.Price;
    }

    public CreateMultiSlotBookingCommandHandler(
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IUserRepository userRepository,
        IBookingLockRepository lockRepository,
        IApplicationDbContext context,
        ISystemSettingService settingService,
        IEmailService emailService,
        PricingDomainService pricingService,
        IMediator mediator,
        ILogger<CreateMultiSlotBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
        _userRepository = userRepository;
        _lockRepository = lockRepository;
        _context = context;
        _settingService = settingService;
        _emailService = emailService;
        _pricingService = pricingService;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<Result<List<Guid>>> Handle(CreateMultiSlotBookingCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var validationResult = ValidateRequest(request);
            if (!validationResult.IsSuccess)
                return Result<List<Guid>>.Failure(validationResult.ErrorMessage!);

            if (!await _userRepository.ExistsAsync(request.UserId, cancellationToken))
                return Result<List<Guid>>.Failure("User not found");

            var slotIds = request.TimeSlots.Select(item => item.TimeSlotId).Distinct().ToList();
            var timeSlots = await _timeSlotRepository.GetByIdsAsync(slotIds, cancellationToken);
            if (timeSlots.Count != slotIds.Count)
                return Result<List<Guid>>.Failure("One or more time slots were not found.");

            var timeSlotMap = timeSlots.ToDictionary(item => item.Id);
            var locks = await ValidateSlotsAsync(request, timeSlotMap, cancellationToken);
            if (!locks.IsSuccess)
                return Result<List<Guid>>.Failure(locks.ErrorMessage!);

            var services = await GetSelectedServicesAsync(request, timeSlots, cancellationToken);
            var depositPercentage = await _settingService.GetDecimalAsync(
                SystemConfiguration.Keys.DepositPercentage,
                DefaultDepositPercentage,
                0m,
                100m,
                cancellationToken);

            var bookingIds = new List<Guid>(request.TimeSlots.Count);
            foreach (var slotRequest in request.TimeSlots)
            {
                var timeSlot = timeSlotMap[slotRequest.TimeSlotId];
                var bookingPrice = _pricingService.CalculateBookingPrice(
                    timeSlot,
                    slotRequest.BookingDate,
                    services.Select(item => new BookingServicePricing(item.Price, item.Quantity)),
                    depositPercentage);

                var booking = Booking.Create(
                    request.UserId,
                    slotRequest.TimeSlotId,
                    slotRequest.BookingDate,
                    bookingPrice.TotalPrice,
                    bookingPrice.DepositAmount);

                foreach (var service in services)
                    booking.AddService(service.Id, service.Name, service.Price, service.Quantity);

                await _bookingRepository.AddAsync(booking, cancellationToken);
                bookingIds.Add(booking.Id);
            }

            foreach (var bookingLock in locks.Value!)
                bookingLock.Release();

            await _context.SaveChangesAsync(cancellationToken);
            await SendConfirmationEmailAsync(request, timeSlotMap, cancellationToken);
            await PublishCreatedNotificationsAsync(request, bookingIds, timeSlotMap, cancellationToken);

            _logger.LogInformation(
                "Created {BookingCount} bookings for user {UserId}",
                bookingIds.Count,
                request.UserId);

            return Result<List<Guid>>.Success(bookingIds);
        }
        catch (DomainException ex)
        {
            _logger.LogWarning(ex, "Multi-slot booking rejected for user {UserId}", request.UserId);
            return Result<List<Guid>>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating multi-slot booking for user {UserId}", request.UserId);
            return Result<List<Guid>>.Failure("Failed to create bookings. Please try again.");
        }
    }

    private static Result<bool> ValidateRequest(CreateMultiSlotBookingCommand request)
    {
        if (request.TimeSlots.Count == 0)
            return Result<bool>.Failure("Select at least one time slot.");

        if (request.TimeSlots.Count > MaxSlotsPerRequest)
            return Result<bool>.Failure($"Only {MaxSlotsPerRequest} time slots can be booked at once.");

        var hasDuplicates = request.TimeSlots
            .GroupBy(item => new { item.TimeSlotId, item.BookingDate })
            .Any(group => group.Count() > 1);

        return hasDuplicates
            ? Result<bool>.Failure("Duplicate time slots are not allowed in the same booking request.")
            : Result<bool>.Success(true);
    }

    private async Task<Result<List<BookingLock>>> ValidateSlotsAsync(
        CreateMultiSlotBookingCommand request,
        IReadOnlyDictionary<Guid, TimeSlot> timeSlotMap,
        CancellationToken cancellationToken)
    {
        var locks = new List<BookingLock>();
        foreach (var slotRequest in request.TimeSlots)
        {
            var timeSlot = timeSlotMap[slotRequest.TimeSlotId];
            if (!timeSlot.IsActive)
                return Result<List<BookingLock>>.Failure("One or more selected time slots are inactive.");

            if (IsPastSlot(slotRequest.BookingDate, timeSlot.TimeRange.StartTime))
                return Result<List<BookingLock>>.Failure("One or more selected time slots are in the past.");

            var userLock = await _lockRepository.GetUserLockAsync(
                slotRequest.TimeSlotId,
                slotRequest.BookingDate,
                request.UserId,
                cancellationToken);

            if (userLock == null || !userLock.IsActive())
                return Result<List<BookingLock>>.Failure("Please lock all selected time slots before booking.");

            var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(
                slotRequest.TimeSlotId,
                slotRequest.BookingDate,
                cancellationToken);

            if (!isAvailable)
                return Result<List<BookingLock>>.Failure("One or more selected time slots are no longer available.");

            locks.Add(userLock);
        }

        return Result<List<BookingLock>>.Success(locks);
    }

    private async Task<List<SelectedAdditionalService>> GetSelectedServicesAsync(
        CreateMultiSlotBookingCommand request,
        IReadOnlyCollection<TimeSlot> timeSlots,
        CancellationToken cancellationToken)
    {
        if (request.SelectedServices is null || request.SelectedServices.Count == 0)
            return [];

        var centerIds = timeSlots.Select(item => item.Pitch.SportCenterId).Distinct().ToList();
        if (centerIds.Count != 1)
            throw new DomainException("Services can only be attached when all selected slots belong to the same sport center.");

        var requestedQuantities = request.SelectedServices
            .GroupBy(item => item.ServiceId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));

        if (requestedQuantities.Values.Any(quantity => quantity <= 0))
            throw new DomainException("Service quantity must be greater than zero.");

        var serviceIds = requestedQuantities.Keys.ToList();
        var services = await _context.AdditionalServices
            .Where(item => serviceIds.Contains(item.Id)
                && item.IsActive
                && item.Status == AdditionalServiceStatus.Active
                && item.SportCenterId == centerIds[0])
            .ToListAsync(cancellationToken);

        if (services.Count != requestedQuantities.Count)
            throw new DomainException("One or more selected services are unavailable.");

        foreach (var service in services)
        {
            var totalQuantity = requestedQuantities[service.Id] * request.TimeSlots.Count;
            service.DecreaseStock(totalQuantity);
        }

        return services
            .Select(service => new SelectedAdditionalService(service, requestedQuantities[service.Id]))
            .ToList();
    }

    private async Task SendConfirmationEmailAsync(
        CreateMultiSlotBookingCommand request,
        IReadOnlyDictionary<Guid, TimeSlot> timeSlotMap,
        CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null || string.IsNullOrWhiteSpace(user.Email))
            return;

        try
        {
            var firstSlot = request.TimeSlots[0];
            var pitchName = timeSlotMap[firstSlot.TimeSlotId].Pitch?.Name ?? "Pitch";

            await _emailService.SendMultiSlotBookingConfirmationAsync(
                user.Email,
                user.FullName,
                pitchName,
                request.TimeSlots.Count,
                firstSlot.BookingDate,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send multi-slot booking confirmation email to {Email}", user.Email);
        }
    }

    private async Task PublishCreatedNotificationsAsync(
        CreateMultiSlotBookingCommand request,
        IReadOnlyList<Guid> bookingIds,
        IReadOnlyDictionary<Guid, TimeSlot> timeSlotMap,
        CancellationToken cancellationToken)
    {
        foreach (var (slotRequest, bookingId) in request.TimeSlots.Zip(bookingIds))
        {
            var timeSlot = timeSlotMap[slotRequest.TimeSlotId];
            await _mediator.Publish(new BookingCreatedNotification(
                bookingId,
                request.UserId,
                timeSlot.PitchId,
                slotRequest.TimeSlotId,
                slotRequest.BookingDate),
                cancellationToken);
        }
    }

    private static bool IsPastSlot(DateOnly bookingDate, TimeSpan startTime)
    {
        var vietnamNow = GetVietnamNow();
        var today = DateOnly.FromDateTime(vietnamNow.DateTime);
        var currentTime = TimeOnly.FromDateTime(vietnamNow.DateTime).ToTimeSpan();

        return bookingDate < today || (bookingDate == today && startTime <= currentTime);
    }

    private static DateTimeOffset GetVietnamNow()
    {
        try
        {
            return TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"));
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"));
        }
    }
}
