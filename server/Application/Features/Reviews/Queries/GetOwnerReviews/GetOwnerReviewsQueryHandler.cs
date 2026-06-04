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
        var reviews = await _context.Reviews
            .AsNoTracking()
            .Include(r => r.User)
            .Include(r => r.Pitch)
            .Where(r => r.Pitch.OwnerId == request.OwnerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = reviews.Select(r => new OwnerReviewDto(
            r.Id,
            r.User.FullName,
            r.PitchId,
            r.Pitch.Name,
            r.Pitch.Type.ToString(),
            r.Rating,
            r.Comment,
            r.OwnerReply,
            r.CreatedAt
        )).ToList();

        return Result<List<OwnerReviewDto>>.Success(dtos);
    }
}
