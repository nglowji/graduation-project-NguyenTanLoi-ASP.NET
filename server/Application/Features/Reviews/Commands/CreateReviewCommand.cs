using Application.Common.Models;
using MediatR;

namespace Application.Features.Reviews.Commands.CreateReview;

public record CreateReviewCommand(
    Guid UserId,
    Guid BookingId,
    int Rating,
    string? Comment
) : IRequest<Result<Guid>>;
