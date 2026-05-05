using Application.Common.Interfaces;

namespace Api.BackgroundServices;

/// <summary>
/// Background service to cleanup expired booking locks
/// Runs every 5 minutes
/// </summary>
public class BookingLockCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BookingLockCleanupService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    public BookingLockCleanupService(
        IServiceProvider serviceProvider,
        ILogger<BookingLockCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Booking Lock Cleanup Service started");

        // Yield control back to allow the host to finish starting up
        await Task.Yield();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredLocksAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Booking Lock Cleanup Service");
            }

            try
            {
                await Task.Delay(_interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("Booking Lock Cleanup Service stopped");
    }

    private async Task CleanupExpiredLocksAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var lockRepository = scope.ServiceProvider.GetRequiredService<IBookingLockRepository>();

        var cleanedCount = await lockRepository.CleanupExpiredLocksAsync(cancellationToken);

        if (cleanedCount > 0)
        {
            _logger.LogInformation(
                "Cleaned up {Count} expired booking locks",
                cleanedCount
            );
        }
    }
}
