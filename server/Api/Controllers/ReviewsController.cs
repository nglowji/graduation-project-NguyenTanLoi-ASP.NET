using Application.Common.DTOs;
using Application.Features.Reviews.Commands.CreateReview;
using Application.Features.Reviews.DTOs;
using Application.Features.Reviews.Queries.GetPitchReviews;
using Api.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1")]
public class ReviewsController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public ReviewsController(IMediator mediator)
    {
        _mediator = mediator;
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
}
