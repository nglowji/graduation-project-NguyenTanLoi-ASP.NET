using Application.Common.Models;
using MediatR;

namespace Application.Features.Payments.Queries.GetUserPaymentHistory;

public record GetUserPaymentHistoryQuery(
    Guid UserId,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<Result<PagedResult<PaymentHistoryDto>>>;
