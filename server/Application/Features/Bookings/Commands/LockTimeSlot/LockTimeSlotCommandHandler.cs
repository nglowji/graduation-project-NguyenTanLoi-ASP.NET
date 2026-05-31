using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.LockTimeSlot;

public class LockTimeSlotCommandHandler : IRequestHandler<LockTimeSlotCommand, Result<Guid>>
{
    private readonly IBookingLockRepository _lockRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IApplicationDbContext _context;
    private readonly IBookingNotificationService _notificationService;
    private readonly ILogger<LockTimeSlotCommandHandler> _logger;

    public LockTimeSlotCommandHandler(
        IBookingLockRepository lockRepository,
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IApplicationDbContext context,
        IBookingNotificationService notificationService,
        ILogger<LockTimeSlotCommandHandler> logger)
    {
        _lockRepository = lockRepository;
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(
        LockTimeSlotCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // 1. Check if time slot exists and is active
            var timeSlot = await _timeSlotRepository.GetByIdAsync(request.TimeSlotId, cancellationToken);
            if (timeSlot == null)
                return Result<Guid>.Failure("Time slot not found");

            if (!timeSlot.IsActive)
                return Result<Guid>.Failure("Time slot is not active");

            if (IsPastSlot(request.BookingDate, timeSlot.TimeRange.StartTime))
                return Result<Guid>.Failure("Khung giờ này đã quá thời gian đặt.");

            // 2. Check if already booked
            var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(
                request.TimeSlotId,
                request.BookingDate,
                cancellationToken
            );

            if (!isAvailable)
                return Result<Guid>.Failure("Time slot is already booked");

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
                    existingLock.ExtendLock(request.LockDurationMinutes);
                    await _context.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation(
                        "Extended lock {LockId} for user {UserId}",
                        existingLock.Id,
                        request.UserId
                    );

                    return Result<Guid>.Success(existingLock.Id);
                }

                // Lock belongs to another user
                return Result<Guid>.Failure("Time slot is currently being booked by another user. Please try again in a few minutes.");
            }

            // 4. Create new lock
            var bookingLock = BookingLock.Create(
                request.TimeSlotId,
                request.BookingDate,
                request.UserId,
                request.LockDurationMinutes
            );

            await _lockRepository.AddAsync(bookingLock, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

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

            return Result<Guid>.Success(bookingLock.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking lock");
            return Result<Guid>.Failure("Failed to lock time slot. Please try again.");
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
