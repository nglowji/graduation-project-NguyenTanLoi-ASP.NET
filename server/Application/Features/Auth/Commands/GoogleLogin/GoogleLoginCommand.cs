using Application.Common.DTOs;
using Application.Features.Auth.Commands.Login;
using MediatR;

namespace Application.Features.Auth.Commands.GoogleLogin;

/// <summary>
/// Command to login/register using Google ID Token
/// </summary>
public record GoogleLoginCommand(
    string AccessToken
) : IRequest<Result<AuthResponse>>;
