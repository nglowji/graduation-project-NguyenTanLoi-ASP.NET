using Application.Common.Models;
using Application.Features.Reviews.DTOs;
using MediatR;

namespace Application.Features.Reviews.Queries.GetPitchReviews;

public record GetPitchReviewsQuery(
    Guid PitchId,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<Result<PagedResult<ReviewDto>>>;
