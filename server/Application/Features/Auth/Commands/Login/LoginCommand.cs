using Application.Common.Models;
using Application.Features.Auth.Commands.Register;
using MediatR;

namespace Application.Features.Auth.Commands.Login;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<Result<AuthResponse>>;
