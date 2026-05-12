using Application.Common.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Auth.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string PhoneNumber,
    string? Address = null,
    UserRole Role = UserRole.Customer
) : IRequest<Result<AuthResponse>>;
