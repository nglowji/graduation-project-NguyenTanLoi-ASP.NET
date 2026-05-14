using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Reviews.Commands.ReplyReview;

public record ReplyReviewCommand(
    Guid ReviewId,
    Guid RequesterId,
    string Content
) : IRequest<Result>;
