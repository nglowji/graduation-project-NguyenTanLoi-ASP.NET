using Application.Common.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Api.BackgroundServices;

/// <summary>
/// Background service to automatically fail expired pending payments
/// Runs every 5 minutes to check for payments that have exceeded the 15-minute timeout
/// </summary>
public class PaymentTimeoutService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PaymentTimeoutService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);
    private readonly TimeSpan _paymentTimeout = TimeSpan.FromMinutes(15);

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

        var cutoffTime = DateTime.UtcNow.Subtract(_paymentTimeout);

        var expiredTransactions = await context.PaymentTransactions
            .Where(pt => pt.Status == PaymentStatus.Pending && pt.CreatedAt < cutoffTime)
            .ToListAsync(cancellationToken);

        if (expiredTransactions.Count == 0)
            return;

        _logger.LogInformation(
            "Found {Count} expired payment transactions",
            expiredTransactions.Count
        );

        foreach (var transaction in expiredTransactions)
        {
            transaction.MarkAsFailed("Payment timeout - exceeded 15 minutes");
            _logger.LogInformation(
                "Marked transaction {TransactionId} as failed due to timeout",
                transaction.Id
            );
        }

        await context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Successfully processed {Count} expired payments",
            expiredTransactions.Count
        );
    }
}
