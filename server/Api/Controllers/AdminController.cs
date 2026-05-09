using Application.Common.DTOs;
using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get list of all users with optional filter
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(PagedResult<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int? role,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminUsersQuery(search, role, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to get users", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Suspend or Activate a user account
    /// </summary>
    [HttpPatch("users/{userId:guid}/suspend")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SuspendUser(Guid userId, CancellationToken cancellationToken = default)
    {
        var command = new SuspendUserCommand(userId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to update user status", result.ErrorMessage);

        return Ok(new { message = "User status updated successfully." });
    }

    /// <summary>
    /// Get pitch approval requests
    /// </summary>
    [HttpGet("pitch-approvals")]
    [ProducesResponseType(typeof(PagedResult<PitchApprovalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPitchApprovals(
        [FromQuery] string status = "pending",
        CancellationToken cancellationToken = default)
    {
        var query = new GetPitchApprovalsQuery(status);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to get pitch approvals", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Approve a pitch registration
    /// </summary>
    [HttpPatch("pitch-approvals/{id:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApprovePitch(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ApprovePitchCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to approve pitch", result.ErrorMessage);

        return Ok(new { message = "Pitch approved successfully." });
    }

    /// <summary>
    /// Reject a pitch registration
    /// </summary>
    [HttpPatch("pitch-approvals/{id:guid}/reject")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectPitch(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new RejectPitchCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to reject pitch", result.ErrorMessage);

        return Ok(new { message = "Pitch registration rejected." });
    }
}
