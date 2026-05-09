using Application.Features.Auth.Commands.Login;
using Application.Features.Auth.Commands.Register;
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
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Registration failed", result.ErrorMessage);

        return CreatedAtAction(
            nameof(GetProfile),
            new { userId = result.Value!.UserId },
            result.Value
        );
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Login failed", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Login or Register with Google ID Token
    /// </summary>
    [HttpPost("google-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GoogleLogin(
        [FromBody] GoogleLoginRequest request,
        CancellationToken cancellationToken)
    {
        var command = new Application.Features.Auth.Commands.GoogleLogin.GoogleLoginCommand(request.IdToken);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Google login failed", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Login or Register with Facebook Access Token
    /// </summary>
    [HttpPost("facebook-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> FacebookLogin(
        [FromBody] FacebookLoginRequest request,
        CancellationToken cancellationToken)
    {
        var command = new Application.Features.Auth.Commands.FacebookLogin.FacebookLoginCommand(request.AccessToken);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Facebook login failed", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProfile()
    {
        // TODO: Implement GetUserProfileQuery
        return Ok(new { Message = "Profile endpoint - To be implemented" });
    }

    /// <summary>
    /// Logout (client-side token removal)
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Logout()
    {
        return NoContent();
    }
}
