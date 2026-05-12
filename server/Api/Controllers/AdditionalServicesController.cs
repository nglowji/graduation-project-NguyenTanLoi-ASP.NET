using Application.Common.DTOs;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Application.Features.AdditionalServices.Commands.CreateService;
using Application.Features.AdditionalServices.Commands.DeleteService;
using Application.Features.AdditionalServices.Commands.UpdateService;
using Application.Features.AdditionalServices.DTOs;
using Application.Features.AdditionalServices.Queries.GetOwnerServices;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/additional-services")]
[Authorize(Roles = "PitchOwner")]
public class AdditionalServicesController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;

    public AdditionalServicesController(IMediator mediator, IApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<List<ServiceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyServices(CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var result = await _mediator.Send(new GetOwnerServicesQuery(ownerId), ct);
        return OkResponse(result.Value);
    }

    [HttpGet("pitch/{pitchId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByPitchId(Guid pitchId, CancellationToken ct)
    {
        var pitch = await _context.Pitches.FirstOrDefaultAsync(p => p.Id == pitchId, ct);
        if (pitch == null) return NotFoundResponse("Pitch not found");
        
        var services = await _context.AdditionalServices
            .Where(s => s.SportCenterId == pitch.SportCenterId && s.IsActive)
            .Select(s => new { s.Id, s.Name, Price = s.Price.Amount, s.Icon })
            .ToListAsync(ct);
            
        return OkResponse(services);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateServiceCommand command, CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var result = await _mediator.Send(command with { OwnerId = ownerId }, ct);
        return result.IsSuccess 
            ? OkResponse(result.Value) 
            : BadRequestResponse(result.ErrorMessage ?? "Failed to create service");
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateServiceCommand command, CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var result = await _mediator.Send(command with { Id = id, OwnerId = ownerId }, ct);
        return result.IsSuccess 
            ? OkResponse<object?>(null, "Service updated successfully") 
            : BadRequestResponse(result.ErrorMessage ?? "Failed to update service");
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var result = await _mediator.Send(new DeleteServiceCommand(id, ownerId), ct);
        return result.IsSuccess 
            ? OkResponse<object?>(null, "Service deleted successfully") 
            : BadRequestResponse(result.ErrorMessage ?? "Failed to delete service");
    }
}
