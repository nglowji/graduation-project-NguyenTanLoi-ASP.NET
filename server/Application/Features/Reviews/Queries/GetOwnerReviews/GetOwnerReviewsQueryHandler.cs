using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Reviews.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Reviews.Queries.GetOwnerReviews;

public class GetOwnerReviewsQueryHandler : IRequestHandler<GetOwnerReviewsQuery, Result<List<OwnerReviewDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOwnerReviewsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<OwnerReviewDto>>> Handle(
        GetOwnerReviewsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Reviews
            .AsNoTracking()
            .Where(r => r.Pitch.OwnerId == request.OwnerId);

        if (request.FromDate.HasValue)
        {
            var fromDate = request.FromDate.Value.Date;
            query = query.Where(r => r.CreatedAt >= fromDate);
        }

        if (request.ToDate.HasValue)
        {
            var toDateExclusive = request.ToDate.Value.Date.AddDays(1);
            query = query.Where(r => r.CreatedAt < toDateExclusive);
        }

        var dtos = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new OwnerReviewDto(
                r.Id,
                r.User.FullName,
                r.PitchId,
                r.Pitch.Name,
                r.Pitch.Type.ToString(),
                r.Rating,
                r.Comment,
                r.OwnerReply,
                r.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return Result<List<OwnerReviewDto>>.Success(dtos);
    }
}
