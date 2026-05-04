using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Services;
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
    private readonly ISystemConfigurationRepository _systemConfigRepository;
    private readonly PricingDomainService _pricingService;
    private readonly IBookingNotificationService _notificationService;
    private readonly ICacheService _cacheService;
    private readonly IEmailService _emailService;
    private readonly IQRService _qrService;
    private readonly ILogger<CreateBookingCommandHandler> _logger;

    public CreateBookingCommandHandler(
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IUserRepository userRepository,
        IBookingLockRepository lockRepository,
        IApplicationDbContext context,
        ISystemConfigurationRepository systemConfigRepository,
        PricingDomainService pricingService,
        IBookingNotificationService notificationService,
        ICacheService cacheService,
        IEmailService emailService,
        IQRService qrService,
        ILogger<CreateBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
        _userRepository = userRepository;
        _lockRepository = lockRepository;
        _context = context;
        _systemConfigRepository = systemConfigRepository;
        _pricingService = pricingService;
        _notificationService = notificationService;
        _cacheService = cacheService;
        _emailService = emailService;
        _qrService = qrService;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

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

            // 5. Create booking with Dynamic Pricing & System Config
            var effectivePrice = _pricingService.CalculateEffectivePrice(timeSlot, request.BookingDate);
            
            // Get deposit percentage from configuration
            var depositPercentStr = await _systemConfigRepository.GetValueAsync(
                Domain.Entities.SystemConfiguration.Keys.DepositPercentage,
                "30",
                cancellationToken);
            
            var depositPercent = decimal.Parse(depositPercentStr);
            
            // Re-calculate deposit based on effective price
            var depositAmount = effectivePrice.CalculatePercentage(depositPercent);

            var booking = Booking.Create(
                request.UserId,
                request.TimeSlotId,
                request.BookingDate,
                effectivePrice,
                depositAmount
            );

            await _bookingRepository.AddAsync(booking, cancellationToken);

            // 6. Release the lock
            userLock.Release();

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            // Notify real-time status update
            await _notificationService.NotifyBookingCreatedAsync(
                timeSlot.PitchId,
                request.TimeSlotId,
                request.BookingDate,
                cancellationToken
            );

            // Invalidate Cache
            var cacheKey = $"available_slots_{timeSlot.PitchId}_{request.BookingDate:yyyyMMdd}";
            await _cacheService.RemoveAsync(cacheKey, cancellationToken);

            // Send Email Notification
            var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
            if (user != null && !string.IsNullOrEmpty(user.Email))
            {
                var qrCodeBase64 = _qrService.GenerateQRCodeBase64(booking.CheckInCode!);
                
                var subject = "Xác nhận đặt sân thành công - SmartSport";
                var body = $@"
                    <h1>Chúc mừng {user.FullName}!</h1>
                    <p>Bạn đã đặt sân thành công tại SmartSport.</p>
                    <p><b>Thông tin đơn hàng:</b></p>
                    <ul>
                        <li>Sân: {timeSlot.Pitch.Name}</li>
                        <li>Ngày: {request.BookingDate:dd/MM/yyyy}</li>
                        <li>Khung giờ: {timeSlot.TimeRange}</li>
                        <li>Mã Check-in: <b>{booking.CheckInCode}</b></li>
                        <li>Tổng tiền: {booking.TotalPrice.Amount:N0} VND</li>
                    </ul>
                    <p>Vui lòng xuất trình mã QR dưới đây khi đến sân:</p>
                    <img src=""data:image/png;base64,{qrCodeBase64}"" alt=""QR Check-in"" />
                    <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>";
                
                await _emailService.SendEmailAsync(user.Email, subject, body, cancellationToken);
            }

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
    }
}
