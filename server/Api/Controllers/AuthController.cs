using Application.Features.Auth.Commands.Login;
using Application.Features.Auth.Commands.Register;
using Application.Common.DTOs;
using Application.Features.Auth.Queries.GetProfile;
using Api.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
public class AuthController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Đăng ký thất bại.");

        return CreatedResponse(
            nameof(GetProfile),
            new { userId = result.Value!.UserId },
            result.Value,
            "Đăng ký thành công."
        );
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Đăng nhập thất bại.");

        return OkResponse(result.Value, "Đăng nhập thành công.");
    }

    [HttpPost("google-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GoogleLogin(
        [FromBody] GoogleLoginRequest request,
        CancellationToken cancellationToken)
    {
        var command = new Application.Features.Auth.Commands.GoogleLogin.GoogleLoginCommand(request.AccessToken);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Đăng nhập Google thất bại.");

        return OkResponse(result.Value, "Đăng nhập Google thành công.");
    }

    [HttpPost("facebook-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> FacebookLogin(
        [FromBody] FacebookLoginRequest request,
        CancellationToken cancellationToken)
    {
        var command = new Application.Features.Auth.Commands.FacebookLogin.FacebookLoginCommand(request.AccessToken);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Đăng nhập Facebook thất bại.");

        return OkResponse(result.Value, "Đăng nhập Facebook thành công.");
    }

    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<Application.Features.Auth.DTOs.UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var result = await _mediator.Send(new GetProfileQuery(userId), cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Không thể lấy thông tin tài khoản.");

        return OkResponse(result.Value);
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status204NoContent)]
    public IActionResult Logout()
    {
        return OkResponse<object?>(null, "Đăng xuất thành công."); // Senior rule: 204 doesn't return body, but we can return 200 with success:true
    }
}
