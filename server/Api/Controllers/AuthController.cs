using Application.Features.Auth.Commands.Login;
using Application.Features.Auth.Commands.Register;
using Application.Features.Auth.Commands.RegisterOwnerCenter;
using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Auth.Queries.GetProfile;
using Api.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
public class AuthController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthController(
        IMediator mediator,
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService)
    {
        _mediator = mediator;
        _context = context;
        _jwtTokenService = jwtTokenService;
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

    [HttpPost("register-owner-center")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterOwnerCenter(
        [FromBody] RegisterOwnerCenterRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new RegisterOwnerCenterCommand(
            userId,
            request.BusinessName,
            request.PhoneNumber,
            request.Street,
            request.Ward,
            request.District,
            request.City
        );

        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Đăng ký chủ sân thất bại.");

        return OkResponse(result.Value, "Đăng ký chủ sân thành công.");
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

    [HttpPost("refresh-token")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId, cancellationToken);
        if (user == null)
            return BadRequestResponse("Không tìm thấy tài khoản.");

        var token = _jwtTokenService.GenerateToken(user);
        var response = new AuthResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.Role,
            token,
            DateTime.UtcNow.AddMinutes(60)
        );

        return OkResponse(response);
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status204NoContent)]
    public IActionResult Logout()
    {
        return OkResponse<object?>(null, "Đăng xuất thành công."); // Senior rule: 204 doesn't return body, but we can return 200 with success:true
    }
}
