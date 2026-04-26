using Application.Common.Models;
using MediatR;

namespace Application.Features.Payments.Queries.GetPaymentTransaction;

public record GetPaymentTransactionQuery(Guid TransactionId) 
    : IRequest<Result<PaymentTransactionDto>>;
