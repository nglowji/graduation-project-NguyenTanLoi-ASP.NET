using Application.Common.DTOs;
using Application.Features.Reviews.Commands.CreateReview;
using Application.Features.Reviews.Commands.DeleteReview;
using Application.Features.Reviews.Commands.ReplyReview;
using Application.Features.Reviews.Commands.UpdateReview;
using Application.Features.Reviews.DTOs;
using Application.Features.Reviews.Queries.GetBookingReview;
using Application.Features.Reviews.Queries.GetPitchReviews;
using Application.Features.Reviews.Queries.GetOwnerReviews;
using Api.Contracts;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1")]
public class ReviewsController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUserRepository _userRepository;

    public ReviewsController(IMediator mediator, IUserRepository userRepository)
    {
        _mediator = mediator;
        _userRepository = userRepository;
    }

    [HttpGet("pitches/{pitchId:guid}/reviews")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ReviewDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByPitch(
        Guid pitchId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPitchReviewsQuery(pitchId, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFoundResponse(result.ErrorMessage ?? "Reviews not found");

        return OkResponse(result.Value);
    }

    [HttpPost("bookings/{bookingId:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        Guid bookingId,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new CreateReviewCommand(userId, bookingId, request.Rating, request.Comment);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to create review");

        return CreatedResponse(nameof(GetByPitch), new { pitchId = Guid.Empty }, result.Value!, "Review created successfully");
    }

    [HttpGet("bookings/{bookingId:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByBooking(
        Guid bookingId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var result = await _mediator.Send(new GetBookingReviewQuery(userId, bookingId), cancellationToken);
        if (!result.IsSuccess)
            return NotFoundResponse(result.ErrorMessage ?? "Review not found");

        return OkResponse(result.Value);
    }

    [HttpPut("bookings/{bookingId:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(
        Guid bookingId,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var result = await _mediator.Send(new UpdateReviewCommand(userId, bookingId, request.Rating, request.Comment), cancellationToken);
        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to update review");

        return OkResponse<object?>(null, "Review updated successfully");
    }

    [HttpDelete("bookings/{bookingId:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(
        Guid bookingId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var result = await _mediator.Send(new DeleteReviewCommand(userId, bookingId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to delete review");

        return OkResponse<object?>(null, "Review deleted successfully");
    }

    [HttpGet("owner/reviews")]
    [Authorize(Roles = "PitchOwner,PitchStaff")]
    [ProducesResponseType(typeof(ApiResponse<List<OwnerReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOwnerReviews(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var ownerId = userId;
        if (User.IsInRole("PitchStaff"))
        {
            var staff = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (staff?.OwnerId == null)
                return BadRequestResponse("Staff account is not linked to an owner");

            ownerId = staff.OwnerId.Value;
        }

        var result = await _mediator.Send(new GetOwnerReviewsQuery(ownerId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get owner reviews");

        return OkResponse(result.Value);
    }

    [HttpPost("owner/reviews/{reviewId:guid}/reply")]
    [Authorize(Roles = "PitchOwner,PitchStaff")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReplyToReview(
        Guid reviewId,
        [FromBody] ReplyReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new ReplyReviewCommand(reviewId, userId, request.Content);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to reply to review");

        return OkResponse<object?>(null, "Reply submitted successfully");
    }
}
