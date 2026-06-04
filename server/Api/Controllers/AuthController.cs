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
using Api.Services;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
public class AuthController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordResetService _passwordResetService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public AuthController(
        IMediator mediator,
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        IPasswordResetService passwordResetService,
        IPasswordHasher passwordHasher,
        IEmailService emailService)
    {
        _mediator = mediator;
        _context = context;
        _jwtTokenService = jwtTokenService;
        _passwordResetService = passwordResetService;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(item => item.Email.ToLower() == email, cancellationToken);
        if (user != null)
        {
            var otp = _passwordResetService.CreateOtp(email);
            await _emailService.SendEmailAsync(email, "Ma OTP dat lai mat khau SmartSport", $"Ma OTP cua ban la: {otp}. Ma co hieu luc trong 5 phut.", cancellationToken);
        }

        return OkResponse<object?>(null, "Nếu email tồn tại, mã OTP đã được gửi.");
    }

    [HttpPost("verify-reset-otp")]
    [AllowAnonymous]
    public IActionResult VerifyResetOtp([FromBody] VerifyResetOtpRequest request)
    {
        var token = _passwordResetService.VerifyOtp(request.Email.Trim().ToLowerInvariant(), request.Otp.Trim());
        return token == null
            ? BadRequestResponse("Mã OTP không đúng hoặc đã hết hạn.")
            : OkResponse(new { ResetToken = token });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
            return BadRequestResponse("Mật khẩu mới phải có ít nhất 8 ký tự.");

        if (!_passwordResetService.ConsumeResetToken(email, request.ResetToken))
            return BadRequestResponse("Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Email.ToLower() == email, cancellationToken);
        if (user == null) return BadRequestResponse("Không tìm thấy tài khoản.");

        user.ChangePassword(_passwordHasher.HashPassword(request.NewPassword));
        await _context.SaveChangesAsync(cancellationToken);
        return OkResponse<object?>(null, "Đặt lại mật khẩu thành công.");
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

public record ForgotPasswordRequest(string Email);
public record VerifyResetOtpRequest(string Email, string Otp);
public record ResetPasswordRequest(string Email, string ResetToken, string NewPassword);
