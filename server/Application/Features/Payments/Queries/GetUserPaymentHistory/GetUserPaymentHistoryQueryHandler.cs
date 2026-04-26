using Application.Common.Interfaces;
using Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Queries.GetUserPaymentHistory;

public class GetUserPaymentHistoryQueryHandler 
    : IRequestHandler<GetUserPaymentHistoryQuery, Result<PagedResult<PaymentHistoryDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<GetUserPaymentHistoryQueryHandler> _logger;

    public GetUserPaymentHistoryQueryHandler(
        IApplicationDbContext context,
        ILogger<GetUserPaymentHistoryQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<PagedResult<PaymentHistoryDto>>> Handle(
        GetUserPaymentHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.PaymentTransactions
            .AsNoTracking()
            .Include(pt => pt.Booking)
                .ThenInclude(b => b.TimeSlot)
                    .ThenInclude(ts => ts.Pitch)
            .Where(pt => pt.Booking.UserId == request.UserId)
            .OrderByDescending(pt => pt.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var transactions = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(pt => new PaymentHistoryDto(
                pt.Id,
                pt.BookingId,
                pt.Booking.TimeSlot.Pitch.Name,
                pt.Booking.BookingDate.ToDateTime(TimeOnly.MinValue),
                $"{pt.Booking.TimeSlot.StartTime:hh\\:mm} - {pt.Booking.TimeSlot.EndTime:hh\\:mm}",
                pt.Amount.Amount,
                pt.Amount.Currency,
                pt.Gateway,
                pt.Status.ToString(),
                pt.ProviderTxnId,
                pt.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        var result = new PagedResult<PaymentHistoryDto>(
            transactions,
            totalCount,
            request.PageNumber,
            request.PageSize
        );

        return Result<PagedResult<PaymentHistoryDto>>.Success(result);
    }
}
