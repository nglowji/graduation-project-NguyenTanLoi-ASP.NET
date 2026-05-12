using Application.Features.Auth.Commands.UpdateProfile;
using Application.Features.Auth.Queries.GetProfile;
using Application.Features.Auth.DTOs;
using Application.Common.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
[Authorize]
public class UsersController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("profile")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _mediator.Send(new GetProfileQuery(userId), ct);
        
        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get profile");

        return OkResponse(result.Value);
    }

    [HttpPatch("profile")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _mediator.Send(command with { UserId = userId }, ct);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to update profile");

        return OkResponse<object?>(null, "Profile updated successfully");
    }
}
