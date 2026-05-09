using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get summary stats for pitch owner dashboard
    /// </summary>
    [HttpGet("owner/stats")]
    [Authorize(Roles = "PitchOwner")]
    [ProducesResponseType(typeof(OwnerDashboardStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetOwnerStats(CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var result = await _mediator.Send(new GetOwnerDashboardStatsQuery(ownerId), cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to get owner stats", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Get admin platform stats
    /// </summary>
    [HttpGet("admin/stats")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AdminDashboardStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAdminStats(CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetAdminDashboardStatsQuery(), cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to get admin stats", result.ErrorMessage);

        return Ok(result.Value);
    }
}
