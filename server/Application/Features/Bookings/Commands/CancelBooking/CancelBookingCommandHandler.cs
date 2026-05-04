using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.CancelBooking;

public class CancelBookingCommandHandler : IRequestHandler<CancelBookingCommand, Result>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IWaitlistRepository _waitlistRepository;
    private readonly ISystemConfigurationRepository _systemConfigRepository;
    private readonly IPaymentService _paymentService;
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IBookingNotificationService _notificationService;
    private readonly ICacheService _cacheService;
    private readonly ILogger<CancelBookingCommandHandler> _logger;
    private readonly BookingDomainService _bookingDomainService;

    public CancelBookingCommandHandler(
        IBookingRepository bookingRepository,
        IWaitlistRepository waitlistRepository,
        ISystemConfigurationRepository systemConfigRepository,
        IPaymentService paymentService,
        IApplicationDbContext context,
        IConfiguration configuration,
        IBookingNotificationService notificationService,
        ICacheService cacheService,
        ILogger<CancelBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _waitlistRepository = waitlistRepository;
        _systemConfigRepository = systemConfigRepository;
        _paymentService = paymentService;
        _context = context;
        _configuration = configuration;
        _notificationService = notificationService;
        _cacheService = cacheService;
        _logger = logger;
        _bookingDomainService = new BookingDomainService();
    }

    public async Task<Result> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetWithDetailsAsync(request.BookingId, cancellationToken);

        if (booking == null)
            return Result.Failure("Booking not found");

        if (booking.UserId != request.UserId)
            return Result.Failure("You are not authorized to cancel this booking");

        if (!booking.CanBeCancelled())
            return Result.Failure($"Cannot cancel booking with status {booking.Status}");

        // Get minimum cancellation hours from system configuration (Database)
        var minCancellationHoursStr = await _systemConfigRepository.GetValueAsync(
            Domain.Entities.SystemConfiguration.Keys.MinimumCancellationHours, 
            "24", 
            cancellationToken);

        var minimumCancellationHours = int.Parse(minCancellationHoursStr);

        // Validate cancellation policy
        try
        {
            _bookingDomainService.ValidateCancellationPolicy(booking, minimumCancellationHours);
        }
        catch (Domain.Exceptions.DomainException ex)
        {
            return Result.Failure(ex.Message);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Cancel booking
            booking.Cancel(request.Reason);

            // Process refund if payment was made
            if (booking.Transaction != null && booking.Transaction.IsSuccessful())
            {
                var shouldRefund = _bookingDomainService.ShouldRefundDeposit(booking, minimumCancellationHours);

                if (shouldRefund)
                {
                    var refundAmount = _bookingDomainService.CalculateRefundAmount(booking, minimumCancellationHours);

                    var refundResult = await _paymentService.ProcessRefundAsync(
                        booking.Transaction.Id,
                        refundAmount,
                        $"Booking cancelled by user: {request.Reason}",
                        cancellationToken
                    );

                    if (!refundResult.IsSuccess)
                    {
                        _logger.LogWarning(
                            "Refund failed for booking {BookingId}, but booking will still be cancelled",
                            booking.Id
                        );
                    }
                }
                else
                {
                    _logger.LogInformation(
                        "No refund for booking {BookingId} - cancelled within minimum cancellation period",
                        booking.Id
                    );
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Notify waitlist users
            var waitlistEntries = await _waitlistRepository.GetWaitingEntriesAsync(
                booking.TimeSlotId, 
                booking.BookingDate, 
                cancellationToken);

            if (waitlistEntries.Any())
            {
                var firstEntry = waitlistEntries.First();
                firstEntry.MarkAsNotified();
                
                var notification = Notification.Create(
                    firstEntry.UserId,
                    Domain.Enums.NotificationType.WaitlistAvailable,
                    "Sân đã có chỗ trống!",
                    $"Khung giờ {firstEntry.TimeSlot.TimeRange.ToString()} ngày {firstEntry.BookingDate} tại sân {firstEntry.TimeSlot.Pitch.Name} hiện đã trống. Hãy đặt ngay!"
                );

                await _context.Notifications.AddAsync(notification, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                
                _logger.LogInformation("Waitlist user {UserId} notified for booking {BookingId} cancellation", firstEntry.UserId, booking.Id);
            }

            await transaction.CommitAsync(cancellationToken);

            // Notify real-time status update
            await _notificationService.NotifyBookingCancelledAsync(
                booking.TimeSlot.PitchId,
                booking.TimeSlotId,
                booking.BookingDate,
                cancellationToken
            );

            // Invalidate Cache
            var cacheKey = $"available_slots_{booking.TimeSlot.PitchId}_{booking.BookingDate:yyyyMMdd}";
            await _cacheService.RemoveAsync(cacheKey, cancellationToken);

            _logger.LogInformation(
                "Booking {BookingId} cancelled by user {UserId}. Reason: {Reason}",
                booking.Id,
                request.UserId,
                request.Reason
            );

            return Result.Success();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Error cancelling booking {BookingId}", request.BookingId);
            return Result.Failure("Failed to cancel booking");
        }
    }
}
