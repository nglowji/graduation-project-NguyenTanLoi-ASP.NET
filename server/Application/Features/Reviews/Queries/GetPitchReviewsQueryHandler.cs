using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Features.Reviews.DTOs;
using MediatR;

namespace Application.Features.Reviews.Queries.GetPitchReviews;

public class GetPitchReviewsQueryHandler : IRequestHandler<GetPitchReviewsQuery, Result<PagedResult<ReviewDto>>>
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IPitchRepository _pitchRepository;

    public GetPitchReviewsQueryHandler(IReviewRepository reviewRepository, IPitchRepository pitchRepository)
    {
        _reviewRepository = reviewRepository;
        _pitchRepository = pitchRepository;
    }

    public async Task<Result<PagedResult<ReviewDto>>> Handle(GetPitchReviewsQuery request, CancellationToken cancellationToken)
    {
        // 1. Check if pitch exists
        var pitchExists = await _pitchRepository.ExistsAsync(request.PitchId, cancellationToken);
        if (!pitchExists)
            return Result<PagedResult<ReviewDto>>.Failure("Pitch not found");

        // 2. Get paged reviews
        var reviews = await _reviewRepository.GetByPitchIdAsync(
            request.PitchId,
            request.PageNumber,
            request.PageSize,
            cancellationToken
        );

        var totalCount = await _reviewRepository.GetTotalCountByPitchIdAsync(request.PitchId, cancellationToken);

        // 3. Map to DTOs
        var reviewDtos = reviews.Select(r => new ReviewDto
        {
            Id = r.Id,
            UserId = r.UserId,
            UserFullName = r.User.FullName,
            PitchId = r.PitchId,
            BookingId = r.BookingId,
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        }).ToList();

        var pagedResult = new PagedResult<ReviewDto>(
            reviewDtos,
            totalCount,
            request.PageNumber,
            request.PageSize
        );

        return Result<PagedResult<ReviewDto>>.Success(pagedResult);
    }
}
