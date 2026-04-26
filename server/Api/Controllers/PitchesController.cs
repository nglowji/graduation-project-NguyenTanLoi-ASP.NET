using Application.Features.Pitches.Commands.CreatePitch;
using Application.Features.Pitches.DTOs;
using Application.Features.Pitches.Queries.GetAvailableTimeSlots;
using Application.Features.Pitches.Queries.SearchPitches;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class PitchesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PitchesController> _logger;

    public PitchesController(IMediator mediator, ILogger<PitchesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Search pitches with filters
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PitchDto), StatusCodes.Status200OK)]
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
            searchTerm,
            type,
            minPrice,
            maxPrice,
            latitude,
            longitude,
            radiusKm,
            pageNumber,
            pageSize
        );

        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new ProblemDetails { Detail = result.ErrorMessage });

        return Ok(result.Value);
    }

    /// <summary>
    /// Get available time slots for a pitch on a specific date
    /// </summary>
    [HttpGet("{pitchId:guid}/available-slots")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<TimeSlotDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableTimeSlots(
        Guid pitchId,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken)
    {
        var query = new GetAvailableTimeSlotsQuery(pitchId, date);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new ProblemDetails { Detail = result.ErrorMessage });

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new pitch (Owner only)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePitchCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Failed to create pitch",
                Detail = result.ErrorMessage
            });
        }

        return CreatedAtAction(
            nameof(GetAvailableTimeSlots),
            new { pitchId = result.Value },
            result.Value
        );
    }
}
