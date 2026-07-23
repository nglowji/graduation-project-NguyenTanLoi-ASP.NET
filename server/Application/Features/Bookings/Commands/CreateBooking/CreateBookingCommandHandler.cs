using System.Globalization;
using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Bookings.Events;
using Domain.Entities;
using Domain.Enums;
using Domain.Exceptions;
using Domain.Services;
using Domain.ValueObjects;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Bookings.Commands.CreateBooking;

/// <summary>
/// Handles booking creation with lock verification and owner-configured slot pricing.
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
    private readonly IEmailService _emailService;
    private readonly PricingDomainService _pricingService;
    private readonly IMediator _mediator;
    private readonly ILogger<CreateBookingCommandHandler> _logger;

    private sealed record BookingPreconditions(TimeSlot TimeSlot, BookingLock UserLock);
    private sealed record SelectedAdditionalService(AdditionalService Service, int Quantity)
    {
        public Guid Id => Service.Id;
        public string Name => Service.Name;
        public Money Price => Service.Price;
    }

    public CreateBookingCommandHandler(
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IUserRepository userRepository,
        IBookingLockRepository lockRepository,
        IApplicationDbContext context,
        ISystemConfigurationRepository systemConfigRepository,
        IEmailService emailService,
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
        _emailService = emailService;
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

            // 3. Create booking with the exact configured slot price
            var booking = await CreateBookingAsync(request, timeSlot, cancellationToken);

            // 4. Release lock and persist
            userLock.Release();
            await _context.SaveChangesAsync(cancellationToken);

            await SendBookingCreatedEmailAsync(booking, cancellationToken);

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

        if (IsPastSlot(request.BookingDate, timeSlot.TimeRange.StartTime))
            return Result<BookingPreconditions>.Failure("Khung giờ này đã quá thời gian đặt.");

        var userLock = await _lockRepository.GetUserLockAsync(
            request.TimeSlotId, request.BookingDate, request.UserId, cancellationToken);

        if (userLock == null || !userLock.IsActive())
            return Result<BookingPreconditions>.Failure("No active lock found. Please lock the time slot first.");

        return Result<BookingPreconditions>.Success(new BookingPreconditions(timeSlot, userLock));
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
            .Where(service => serviceIds.Contains(service.Id)
                && service.IsActive
                && service.Status == AdditionalServiceStatus.Active)
            .ToListAsync(cancellationToken);

        if (additionalServices.Count != requestedQuantities.Count)
            throw new DomainException("One or more selected services are unavailable");

        foreach (var service in additionalServices)
        {
            service.DecreaseStock(requestedQuantities[service.Id]);
        }

        return additionalServices
            .Select(service => new SelectedAdditionalService(service, requestedQuantities[service.Id]))
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

    private async Task SendBookingCreatedEmailAsync(Booking booking, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == booking.UserId, cancellationToken);
            var timeSlot = await _context.TimeSlots
                .AsNoTracking()
                .Include(item => item.Pitch)
                .FirstOrDefaultAsync(item => item.Id == booking.TimeSlotId, cancellationToken);

            if (user == null || timeSlot?.Pitch == null || string.IsNullOrWhiteSpace(user.Email))
                return;

            var subject = $"[SmartSport] Dat san thanh cong - {timeSlot.Pitch.Name}";
            var body = $"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #2563eb; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">SmartSport</h1>
                <p style="margin: 8px 0 0; opacity: 0.9;">Don dat san cua ban da duoc tao thanh cong</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="margin: 0 0 16px; color: #1e293b;">Chao {user.FullName},</h2>
                <p style="color: #475569; line-height: 1.6;">SmartSport da ghi nhan don dat san cua ban. Vui long thanh toan coc de chu san xac nhan lich.</p>
                <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
                  <p style="margin: 0 0 8px; color: #64748b;">San: <strong style="color: #0f172a;">{timeSlot.Pitch.Name}</strong></p>
                  <p style="margin: 0 0 8px; color: #64748b;">Ngay: <strong style="color: #0f172a;">{booking.BookingDate:dd/MM/yyyy}</strong></p>
                  <p style="margin: 0 0 8px; color: #64748b;">Khung gio: <strong style="color: #0f172a;">{timeSlot.TimeRange.StartTime:hh\\:mm} - {timeSlot.TimeRange.EndTime:hh\\:mm}</strong></p>
                  <p style="margin: 0; color: #64748b;">Tong tien: <strong style="color: #2563eb;">{booking.TotalPrice.Amount:N0} VND</strong></p>
                </div>
              </div>
            </div>
            """;

            await _emailService.SendEmailAsync(user.Email, subject, body, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send booking created email for booking {BookingId}", booking.Id);
        }
    }
}
