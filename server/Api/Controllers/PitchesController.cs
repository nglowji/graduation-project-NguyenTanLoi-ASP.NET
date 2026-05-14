using Application.Common.DTOs;
using Application.Features.Pitches.Commands.CreatePitch;
using Application.Features.Pitches.Commands.UpdatePitch;
using Application.Features.Pitches.Commands.DeletePitch;
using Application.Features.Pitches.DTOs;
using Application.Features.Pitches.Queries.GetAvailableTimeSlots;
using Application.Features.Pitches.Queries.GetPitchById;
using Application.Features.Pitches.Queries.SearchPitches;
using Application.Features.Dashboard.Queries;
using Domain.Enums;
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

    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PitchDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? searchTerm,
        [FromQuery] PitchType? type,
        [FromQuery] string? sportType,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? province,
        [FromQuery] string? district,
        [FromQuery] string? ward,
        [FromQuery] decimal? minRating,
        [FromQuery] double? latitude,
        [FromQuery] double? longitude,
        [FromQuery] double? radiusKm,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new SearchPitchesQuery(
            searchTerm, type, sportType, minPrice, maxPrice,
            province, district, ward, minRating,
            latitude, longitude, radiusKm,
            pageNumber, pageSize
        );

        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Search failed");

        return OkResponse(result.Value);
    }

    [HttpGet("{pitchId:guid}/available-slots")]
    [HttpGet("{pitchId:guid}/timeslots")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<TimeSlotDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAvailableTimeSlots(
        Guid pitchId,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken)
    {
        var query = new GetAvailableTimeSlotsQuery(pitchId, date);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get available slots");

        return OkResponse(result.Value);
    }

    [HttpGet("{pitchId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PitchDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid pitchId,
        CancellationToken cancellationToken)
    {
        var query = new GetPitchByIdQuery(pitchId);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFoundResponse(result.ErrorMessage ?? "Pitch not found");

        return OkResponse(result.Value);
    }

    [HttpPost]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePitchCommand command,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var commandWithOwner = command with { OwnerId = ownerId };
        var result = await _mediator.Send(commandWithOwner, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to create pitch");

        return OkResponse(result.Value, "Pitch created successfully");
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdatePitchCommand command,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var commandWithIds = command with { Id = id, OwnerId = ownerId };
        var result = await _mediator.Send(commandWithIds, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to update pitch");

        return OkResponse<object?>(null, "Pitch updated successfully");
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var command = new DeletePitchCommand(id, ownerId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to delete pitch");

        return OkResponse<object?>(null, "Pitch deleted successfully");
    }

    [HttpGet("my")]
    [Authorize(Roles = "PitchOwner")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMyPitches(CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var query = new GetOwnerPitchesQuery(ownerId);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get my pitches");

        return OkResponse(result.Value);
    }
}
