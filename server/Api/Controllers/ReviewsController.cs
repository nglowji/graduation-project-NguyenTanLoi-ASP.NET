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

    /// <summary>
    /// Get reviews for a pitch
    /// </summary>
    [HttpGet("pitches/{pitchId:guid}/reviews")]
    [ProducesResponseType(typeof(PagedResult<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByPitch(
        Guid pitchId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPitchReviewsQuery(pitchId, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFoundProblem("Reviews not found", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a review for a completed booking
    /// </summary>
    [HttpPost("bookings/{bookingId:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
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
            return BadRequestProblem("Failed to create review", result.ErrorMessage);

        return CreatedAtAction(
            nameof(GetByPitch),
            new { pitchId = Guid.Empty },
            result.Value
        );
    }
}
