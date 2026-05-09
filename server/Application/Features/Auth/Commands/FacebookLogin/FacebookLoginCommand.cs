using Application.Common.DTOs;
using Application.Features.Auth.Commands.Login;
using MediatR;

namespace Application.Features.Auth.Commands.FacebookLogin;

/// <summary>
/// Command to login/register using Facebook Access Token
/// </summary>
public record FacebookLoginCommand(
    string AccessToken
) : IRequest<Result<AuthResponse>>;
