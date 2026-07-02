using Application.Common.DTOs;
using Application.Features.Reviews.DTOs;
using MediatR;

namespace Application.Features.Reviews.Queries.GetOwnerReviews;

public record GetOwnerReviewsQuery(
    Guid OwnerId,
    DateTime? FromDate = null,
    DateTime? ToDate = null)
    : IRequest<Result<List<OwnerReviewDto>>>;
