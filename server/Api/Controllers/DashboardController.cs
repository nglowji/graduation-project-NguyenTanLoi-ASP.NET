using Application.Common.DTOs;
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

    [HttpGet("owner/stats")]
    [Authorize(Roles = "PitchOwner")]
    [ProducesResponseType(typeof(ApiResponse<OwnerDashboardStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetOwnerStats(CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var result = await _mediator.Send(new GetOwnerDashboardStatsQuery(ownerId), cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get owner stats");

        return OkResponse(result.Value);
    }

    [HttpGet("owner/revenue")]
    [Authorize(Roles = "PitchOwner")]
    [ProducesResponseType(typeof(ApiResponse<OwnerDashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetOwnerRevenue(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var result = await _mediator.Send(
            new GetOwnerDashboardQuery(ownerId, days, fromDate, toDate),
            cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get owner revenue");

        return OkResponse(result.Value);
    }

    [HttpGet("admin/stats")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<AdminDashboardStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAdminStats(CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetAdminDashboardStatsQuery(), cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get admin stats");

        return OkResponse(result.Value);
    }

    [HttpGet("admin/revenue")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<AdminRevenueReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAdminRevenue(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetAdminRevenueReportQuery(fromDate, toDate, days), cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get admin revenue");

        return OkResponse(result.Value);
    }
}
