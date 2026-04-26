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

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredLocksAsync(stoppingToken);
                await Task.Delay(_interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Booking Lock Cleanup Service is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Booking Lock Cleanup Service");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
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
