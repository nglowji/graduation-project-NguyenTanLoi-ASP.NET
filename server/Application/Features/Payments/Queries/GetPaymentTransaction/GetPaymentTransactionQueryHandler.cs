using Application.Common.Interfaces;
using Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Queries.GetPaymentTransaction;

public class GetPaymentTransactionQueryHandler 
    : IRequestHandler<GetPaymentTransactionQuery, Result<PaymentTransactionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<GetPaymentTransactionQueryHandler> _logger;

    public GetPaymentTransactionQueryHandler(
        IApplicationDbContext context,
        ILogger<GetPaymentTransactionQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<PaymentTransactionDto>> Handle(
        GetPaymentTransactionQuery request,
        CancellationToken cancellationToken)
    {
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
            _logger.LogWarning("Transaction {TransactionId} not found", request.TransactionId);
            return Result<PaymentTransactionDto>.Failure("Transaction not found");
        }

        return Result<PaymentTransactionDto>.Success(transaction);
    }
}
