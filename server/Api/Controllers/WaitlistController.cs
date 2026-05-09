using Application.Common.DTOs;
using Application.Features.Waitlist.Commands.JoinWaitlist;
using Api.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
[Authorize]
public class WaitlistController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public WaitlistController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Join the waitlist for a specific time slot and date
    /// </summary>
    [HttpPost("join")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Join(
        [FromBody] JoinWaitlistRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new JoinWaitlistCommand(userId, request.TimeSlotId, request.Date);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to join waitlist", result.ErrorMessage);

        return Ok(new { WaitlistId = result.Value, Message = "Successfully joined waitlist" });
    }
}
