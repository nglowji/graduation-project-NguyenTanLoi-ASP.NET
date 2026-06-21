using Application.Common.Interfaces;
using Application.Common.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Queries.GetPaymentTransaction;

public class GetPaymentTransactionQueryHandler 
    : IRequestHandler<GetPaymentTransactionQuery, Result<PaymentTransactionDto>>
{
    private static readonly TimeSpan SynchronizationInterval = TimeSpan.FromSeconds(55);

    private readonly IApplicationDbContext _context;
    private readonly IPaymentGatewayResolver _paymentGatewayResolver;
    private readonly ILogger<GetPaymentTransactionQueryHandler> _logger;

    public GetPaymentTransactionQueryHandler(
        IApplicationDbContext context,
        IPaymentGatewayResolver paymentGatewayResolver,
        ILogger<GetPaymentTransactionQueryHandler> logger)
    {
        _context = context;
        _paymentGatewayResolver = paymentGatewayResolver;
        _logger = logger;
    }

    public async Task<Result<PaymentTransactionDto>> Handle(
        GetPaymentTransactionQuery request,
        CancellationToken cancellationToken)
    {
        var transactionEntity = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(pt => pt.Id == request.TransactionId)
            .Select(pt => new { pt.Id, pt.Gateway, pt.Status, pt.CreatedAt, pt.UpdatedAt })
            .FirstOrDefaultAsync(cancellationToken);

        if (transactionEntity == null)
        {
            _logger.LogWarning("Transaction {TransactionId} not found", request.TransactionId);
            return Result<PaymentTransactionDto>.Failure("Transaction not found");
        }

        if (ShouldSynchronize(transactionEntity.Status, transactionEntity.CreatedAt, transactionEntity.UpdatedAt))
        {
            try
            {
                var gateway = _paymentGatewayResolver.Resolve(transactionEntity.Gateway);
                await gateway.SynchronizePaymentAsync(transactionEntity.Id, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to synchronize transaction {TransactionId}", request.TransactionId);
            }
        }

        var transaction = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(pt => pt.Id == request.TransactionId)
            .Select(pt => new PaymentTransactionDto(
                pt.Id,
                pt.BookingId,
                pt.Amount.Amount,
                pt.Amount.Currency,
                pt.Gateway,
                pt.Status.ToString(),
                pt.ProviderTxnId,
                pt.FailureReason,
                pt.RefundReason,
                pt.CreatedAt,
                pt.UpdatedAt
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (transaction == null)
        {
            _logger.LogWarning("Transaction {TransactionId} not found after synchronization", request.TransactionId);
            return Result<PaymentTransactionDto>.Failure("Transaction not found");
        }

        return Result<PaymentTransactionDto>.Success(transaction);
    }

    private static bool ShouldSynchronize(
        Domain.Enums.PaymentStatus status,
        DateTime createdAt,
        DateTime? updatedAt)
    {
        if (status is not (Domain.Enums.PaymentStatus.Pending or Domain.Enums.PaymentStatus.Processing))
            return false;

        var lastCheckedAt = updatedAt ?? createdAt;
        return DateTime.UtcNow - lastCheckedAt >= SynchronizationInterval;
    }
}
