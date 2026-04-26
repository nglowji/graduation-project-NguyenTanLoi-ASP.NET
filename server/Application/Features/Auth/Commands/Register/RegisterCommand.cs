using Application.Common.Models;
using Domain.Enums;
using MediatR;

namespace Application.Features.Auth.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string PhoneNumber,
    UserRole Role = UserRole.Customer
) : IRequest<Result<AuthResponse>>;

public record AuthResponse(
    Guid UserId,
    string Email,
    string FullName,
    UserRole Role,
    string Token,
    DateTime ExpiresAt
);
