using Application.Features.Bookings.Commands.CancelBooking;
using Application.Features.Bookings.Commands.CreateBooking;
using Application.Features.Bookings.Commands.LockTimeSlot;
using Application.Features.Bookings.Commands.ReleaseLock;
using Application.Features.Bookings.DTOs;
using Application.Features.Bookings.Queries.GetBookingById;
using Application.Features.Dashboard.Queries;
using Api.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
[Authorize]
public class BookingsController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public BookingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Lock a time slot before booking (prevents double booking)
    /// </summary>
    [HttpPost("lock")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LockTimeSlot(
        [FromBody] LockTimeSlotRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new LockTimeSlotCommand(
            userId,
            request.TimeSlotId,
            request.BookingDate,
            request.LockDurationMinutes
        );

        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to lock time slot", result.ErrorMessage);

        return Ok(new { LockId = result.Value, Message = "Time slot locked successfully" });
    }

    /// <summary>
    /// Release a time slot lock
    /// </summary>
    [HttpPost("release-lock/{lockId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReleaseLock(
        Guid lockId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new ReleaseLockCommand(lockId, userId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to release lock", result.ErrorMessage);

        return NoContent();
    }

    /// <summary>
    /// Get booking by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetBookingByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFoundProblem("Booking not found", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new booking (requires active lock)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new CreateBookingCommand(userId, request.TimeSlotId, request.BookingDate);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to create booking", result.ErrorMessage);

        return CreatedAtAction(nameof(GetById), new { id = result.Value }, result.Value);
    }

    /// <summary>
    /// Cancel a booking
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Cancel(
        Guid id,
        [FromBody] CancelBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new CancelBookingCommand(id, userId, request.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to cancel booking", result.ErrorMessage);

        return NoContent();
    }

    /// <summary>
    /// Get bookings for owner's pitches
    /// </summary>
    [HttpGet("owner")]
    [Authorize(Roles = "PitchOwner")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOwnerBookings(
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var query = new GetOwnerBookingsQuery(ownerId, status, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to get owner bookings", result.ErrorMessage);

        return Ok(result.Value);
    }
}
