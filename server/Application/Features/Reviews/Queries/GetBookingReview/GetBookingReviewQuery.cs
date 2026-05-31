using Application.Common.DTOs;
using Application.Features.Reviews.DTOs;
using MediatR;

namespace Application.Features.Reviews.Queries.GetBookingReview;

public record GetBookingReviewQuery(
    Guid UserId,
    Guid BookingId
) : IRequest<Result<ReviewDto>>;
