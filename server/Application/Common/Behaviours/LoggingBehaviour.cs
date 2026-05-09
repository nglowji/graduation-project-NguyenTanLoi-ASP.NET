using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Common.Behaviours;

/// <summary>
/// MediatR pipeline behaviour for structured logging with performance tracking.
/// Logs warnings for requests exceeding the performance threshold.
/// </summary>
public class LoggingBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private const int PerformanceThresholdMs = 500;

    private readonly ILogger<LoggingBehaviour<TRequest, TResponse>> _logger;

    public LoggingBehaviour(ILogger<LoggingBehaviour<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var startTime = Stopwatch.GetTimestamp();

        _logger.LogInformation("Handling {RequestName}", requestName);

        try
        {
            var response = await next();
            var elapsedMs = GetElapsedMilliseconds(startTime);

            if (elapsedMs > PerformanceThresholdMs)
            {
                _logger.LogWarning(
                    "Long running request: {RequestName} ({ElapsedMs}ms)",
                    requestName, elapsedMs);
            }
            else
            {
                _logger.LogInformation(
                    "Handled {RequestName} in {ElapsedMs}ms",
                    requestName, elapsedMs);
            }

            return response;
        }
        catch (Exception ex)
        {
            var elapsedMs = GetElapsedMilliseconds(startTime);

            _logger.LogError(
                ex,
                "Error handling {RequestName} after {ElapsedMs}ms",
                requestName, elapsedMs);

            throw;
        }
    }

    private static long GetElapsedMilliseconds(long startTimestamp) =>
        Stopwatch.GetElapsedTime(startTimestamp).Milliseconds;
}
