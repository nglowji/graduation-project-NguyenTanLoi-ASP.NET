using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Api.BackgroundServices;

/// <summary>
/// Background service to automatically fail expired pending payments
/// Runs every minute to check for payments that exceeded the configured booking hold window.
/// </summary>
public class PaymentTimeoutService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PaymentTimeoutService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

    public PaymentTimeoutService(
        IServiceProvider serviceProvider,
        ILogger<PaymentTimeoutService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Payment Timeout Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredPaymentsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing expired payments");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Payment Timeout Service stopped");
    }

    private async Task ProcessExpiredPaymentsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<IBookingNotificationService>();
        var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();
        var settingService = scope.ServiceProvider.GetRequiredService<ISystemSettingService>();

        var timeoutMinutes = await settingService.GetIntAsync(
            SystemConfiguration.Keys.BookingLockDurationMinutes,
            10,
            1,
            60,
            cancellationToken);
        var cutoffTime = DateTime.UtcNow.AddMinutes(-timeoutMinutes);

        var expiredTransactions = await context.PaymentTransactions
            .Where(pt => pt.Status == PaymentStatus.Pending && pt.CreatedAt < cutoffTime)
            .ToListAsync(cancellationToken);

        var expiredBookings = await context.Bookings
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
            .Where(b => b.Status == BookingStatus.PendingDeposit && b.CreatedAt < cutoffTime)
            .ToListAsync(cancellationToken);

        if (expiredTransactions.Count == 0 && expiredBookings.Count == 0)
            return;

        _logger.LogInformation(
            "Found {TransactionCount} expired payment transactions and {BookingCount} expired pending bookings",
            expiredTransactions.Count,
            expiredBookings.Count
        );

        foreach (var transaction in expiredTransactions)
        {
            transaction.MarkAsFailed($"Payment timeout - exceeded {timeoutMinutes} minutes");
            _logger.LogInformation(
                "Marked transaction {TransactionId} as failed due to timeout",
                transaction.Id
            );
        }

        foreach (var booking in expiredBookings)
        {
            booking.Cancel($"Deposit payment timeout - exceeded {timeoutMinutes} minutes");
            _logger.LogInformation(
                "Cancelled booking {BookingId} because deposit was not paid within {TimeoutMinutes} minutes",
                booking.Id,
                timeoutMinutes
            );
        }

        await context.SaveChangesAsync(cancellationToken);

        foreach (var booking in expiredBookings)
        {
            await notificationService.NotifyBookingCancelledAsync(
                booking.TimeSlot.PitchId,
                booking.TimeSlotId,
                booking.BookingDate,
                cancellationToken
            );

            await cacheService.RemoveAsync(
                $"available_slots_{booking.TimeSlot.PitchId}_{booking.BookingDate:yyyyMMdd}",
                cancellationToken
            );
        }

        _logger.LogInformation(
            "Successfully processed {TransactionCount} expired payments and {BookingCount} expired pending bookings",
            expiredTransactions.Count,
            expiredBookings.Count
        );
    }
}
