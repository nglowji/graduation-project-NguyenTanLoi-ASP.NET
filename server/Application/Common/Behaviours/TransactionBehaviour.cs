using Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Common.Behaviours;

/// <summary>
/// MediatR pipeline behavior that manages database transactions for requests implementing ITransactionalRequest.
/// </summary>
public class TransactionBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>, ITransactionalRequest
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<TransactionBehaviour<TRequest, TResponse>> _logger;

    public TransactionBehaviour(IApplicationDbContext context, ILogger<TransactionBehaviour<TRequest, TResponse>> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;

        try
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            _logger.LogInformation("Beginning transaction for {RequestName}", requestName);

            var response = await next();

            await transaction.CommitAsync(cancellationToken);
            _logger.LogInformation("Committed transaction for {RequestName}", requestName);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Transaction failed for {RequestName}. Rolling back.", requestName);
            // Rollback is automatic with 'await using var transaction' if not committed
            throw;
        }
    }
}
