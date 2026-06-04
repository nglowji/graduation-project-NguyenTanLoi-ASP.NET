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
[Authorize(Roles = "PitchOwner,PitchStaff")]
public class AdditionalServicesController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;
    private readonly IUserRepository _userRepository;

    public AdditionalServicesController(IMediator mediator, IApplicationDbContext context, IUserRepository userRepository)
    {
        _mediator = mediator;
        _context = context;
        _userRepository = userRepository;
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<List<ServiceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyServices(CancellationToken ct)
    {
        var ownerId = await GetOwnerId(ct);
        var result = await _mediator.Send(new GetOwnerServicesQuery(ownerId), ct);
        return OkResponse(result.Value);
    }

    [HttpGet("pitch/{pitchId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByPitchId(Guid pitchId, CancellationToken ct)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}".TrimEnd('/');
        var pitch = await _context.Pitches.FirstOrDefaultAsync(p => p.Id == pitchId, ct);
        if (pitch == null) return NotFoundResponse("Pitch not found");
        
        var services = await _context.AdditionalServices
            .Where(s => s.SportCenterId == pitch.SportCenterId && s.IsActive)
            .Select(s => new { s.Id, s.Name, Price = s.Price.Amount, s.Icon, s.ImageUrl, s.StockQuantity })
            .ToListAsync(ct);

        var normalized = services
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Price,
                s.Icon,
                s.StockQuantity,
                ImageUrl = BuildAbsoluteUrl(s.ImageUrl, baseUrl)
            })
            .ToList();
            
        return OkResponse(normalized);
    }

    private static string? BuildAbsoluteUrl(string? imageUrl, string baseUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return null;

        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out _))
            return imageUrl;

        if (imageUrl.StartsWith("/", StringComparison.Ordinal))
            return $"{baseUrl}{imageUrl}";

        return $"{baseUrl}/{imageUrl}";
    }

    [HttpPost]
    [Authorize(Roles = "PitchOwner")]
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
    [Authorize(Roles = "PitchOwner")]
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
    [Authorize(Roles = "PitchOwner")]
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

    private async Task<Guid> GetOwnerId(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (!User.IsInRole("PitchStaff")) return userId;
        var staff = await _userRepository.GetByIdAsync(userId, ct);
        return staff?.OwnerId ?? Guid.Empty;
    }
}
