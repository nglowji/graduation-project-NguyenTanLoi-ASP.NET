using Application.Common.DTOs;
using Application.Features.Reviews.DTOs;
using MediatR;

namespace Application.Features.Reviews.Queries.GetOwnerReviews;

public record GetOwnerReviewsQuery(Guid OwnerId)
    : IRequest<Result<List<OwnerReviewDto>>>;
