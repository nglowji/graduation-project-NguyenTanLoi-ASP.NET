using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.LockTimeSlot;

public class LockTimeSlotCommandHandler : IRequestHandler<LockTimeSlotCommand, Result<BookingLockResult>>
{
    private readonly IBookingLockRepository _lockRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IApplicationDbContext _context;
    private readonly ISystemSettingService _settingService;
    private readonly IBookingNotificationService _notificationService;
    private readonly ICacheService _cacheService;
    private readonly ILogger<LockTimeSlotCommandHandler> _logger;

    public LockTimeSlotCommandHandler(
        IBookingLockRepository lockRepository,
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IApplicationDbContext context,
        ISystemSettingService settingService,
        IBookingNotificationService notificationService,
        ICacheService cacheService,
        ILogger<LockTimeSlotCommandHandler> logger)
    {
        _lockRepository = lockRepository;
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
        _context = context;
        _settingService = settingService;
        _notificationService = notificationService;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<Result<BookingLockResult>> Handle(
        LockTimeSlotCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var lockDurationMinutes = request.LockDurationMinutes
                ?? await _settingService.GetIntAsync(
                    SystemConfiguration.Keys.BookingLockDurationMinutes,
                    10,
                    1,
                    60,
                    cancellationToken);

            // 1. Check if time slot exists and is active
            var timeSlot = await _timeSlotRepository.GetByIdAsync(request.TimeSlotId, cancellationToken);
            if (timeSlot == null)
                return Result<BookingLockResult>.Failure("Time slot not found");

            if (!timeSlot.IsActive)
                return Result<BookingLockResult>.Failure("Time slot is not active");

            if (IsPastSlot(request.BookingDate, timeSlot.TimeRange.StartTime))
                return Result<BookingLockResult>.Failure("Khung giờ này đã quá thời gian đặt.");

            // 2. Check if already booked
            var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(
                request.TimeSlotId,
                request.BookingDate,
                cancellationToken
            );

            if (!isAvailable)
                return Result<BookingLockResult>.Failure("Time slot is already booked");

            // 3. Check for existing active locks
            var existingLock = await _lockRepository.GetActiveLockAsync(
                request.TimeSlotId,
                request.BookingDate,
                cancellationToken
            );

            if (existingLock != null)
            {
                // If lock belongs to same user, extend it
                if (existingLock.UserId == request.UserId)
                {
                    existingLock.ExtendLock(lockDurationMinutes);
                    await _context.SaveChangesAsync(cancellationToken);
                    await InvalidateAvailableSlotsCacheAsync(timeSlot.PitchId, request.BookingDate, cancellationToken);

                    _logger.LogInformation(
                        "Extended lock {LockId} for user {UserId}",
                        existingLock.Id,
                        request.UserId
                    );

                    return Result<BookingLockResult>.Success(new BookingLockResult(
                        existingLock.Id,
                        existingLock.ExpiresAt,
                        lockDurationMinutes));
                }

                // Lock belongs to another user
                return Result<BookingLockResult>.Failure("Time slot is currently being booked by another user. Please try again in a few minutes.");
            }

            // 4. Create new lock
            var bookingLock = BookingLock.Create(
                request.TimeSlotId,
                request.BookingDate,
                request.UserId,
                lockDurationMinutes
            );

            await _lockRepository.AddAsync(bookingLock, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await InvalidateAvailableSlotsCacheAsync(timeSlot.PitchId, request.BookingDate, cancellationToken);

            // Notify real-time status update
            await _notificationService.NotifyTimeSlotStatusChangedAsync(
                timeSlot.PitchId,
                request.TimeSlotId,
                "Locked",
                request.BookingDate,
                cancellationToken
            );

            _logger.LogInformation(
                "Created lock {LockId} for time slot {TimeSlotId} on {BookingDate} by user {UserId}",
                bookingLock.Id,
                request.TimeSlotId,
                request.BookingDate,
                request.UserId
            );

            return Result<BookingLockResult>.Success(new BookingLockResult(
                bookingLock.Id,
                bookingLock.ExpiresAt,
                lockDurationMinutes));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking lock");
            return Result<BookingLockResult>.Failure("Failed to lock time slot. Please try again.");
        }
    }

    private Task InvalidateAvailableSlotsCacheAsync(
        Guid pitchId,
        DateOnly bookingDate,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"available_slots_{pitchId}_{bookingDate:yyyyMMdd}";
        return _cacheService.RemoveAsync(cacheKey, cancellationToken);
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
