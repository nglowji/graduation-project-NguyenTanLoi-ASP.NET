using Application.Common.Models;
using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Get summary stats for pitch owner dashboard</summary>
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
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Lấy thống kê chủ sân thất bại",
                Detail = result.ErrorMessage,
                Status = StatusCodes.Status400BadRequest
            });
        }
        
        return Ok(result.Value);
    }

    /// <summary>Get admin platform stats</summary>
    [HttpGet("admin/stats")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AdminDashboardStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAdminStats(CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetAdminDashboardStatsQuery(), cancellationToken);
        
        if (!result.IsSuccess)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Lấy thống kê hệ thống thất bại",
                Detail = result.ErrorMessage,
                Status = StatusCodes.Status400BadRequest
            });
        }
        
        return Ok(result.Value);
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            return userId;
        return Guid.Empty;
    }
}
