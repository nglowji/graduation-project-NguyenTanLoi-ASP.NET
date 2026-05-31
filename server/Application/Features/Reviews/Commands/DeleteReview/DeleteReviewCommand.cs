using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Reviews.Commands.DeleteReview;

public record DeleteReviewCommand(
    Guid UserId,
    Guid BookingId
) : IRequest<Result>;
