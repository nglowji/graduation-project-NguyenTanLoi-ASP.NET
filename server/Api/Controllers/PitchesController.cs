using Application.Features.Pitches.Commands.CreatePitch;
using Application.Features.Pitches.DTOs;
using Application.Features.Pitches.Queries.GetAvailableTimeSlots;
using Application.Features.Pitches.Queries.SearchPitches;
using Application.Features.Dashboard.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
public class PitchesController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public PitchesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Search pitches with filters
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PitchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? searchTerm,
        [FromQuery] Domain.Enums.PitchType? type,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] double? latitude,
        [FromQuery] double? longitude,
        [FromQuery] double? radiusKm,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new SearchPitchesQuery(
            searchTerm, type, minPrice, maxPrice,
            latitude, longitude, radiusKm,
            pageNumber, pageSize
        );

        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Search failed", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Get available time slots for a pitch on a specific date
    /// </summary>
    [HttpGet("{pitchId:guid}/available-slots")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<TimeSlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAvailableTimeSlots(
        Guid pitchId,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken)
    {
        var query = new GetAvailableTimeSlotsQuery(pitchId, date);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to get available slots", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new pitch (Owner only)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePitchCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to create pitch", result.ErrorMessage);

        return CreatedAtAction(
            nameof(GetAvailableTimeSlots),
            new { pitchId = result.Value },
            result.Value
        );
    }

    /// <summary>
    /// Get owner's pitches with today's stats
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "PitchOwner")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMyPitches(CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var query = new GetOwnerPitchesQuery(ownerId);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to get my pitches", result.ErrorMessage);

        return Ok(result.Value);
    }
}
