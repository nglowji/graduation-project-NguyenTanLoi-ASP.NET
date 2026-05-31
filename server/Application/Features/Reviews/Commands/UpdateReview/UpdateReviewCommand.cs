using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Reviews.Commands.UpdateReview;

public record UpdateReviewCommand(
    Guid UserId,
    Guid BookingId,
    int Rating,
    string? Comment
) : IRequest<Result>;
