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
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
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
            return BadRequestResponse(result.ErrorMessage ?? "Failed to join waitlist");

        return OkResponse(new { WaitlistId = result.Value, Message = "Successfully joined waitlist" });
    }
}
