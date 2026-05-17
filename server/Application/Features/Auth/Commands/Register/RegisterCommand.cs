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
    string? MapLink = null,
    string? BusinessName = null,
    string? Ward = null,
    string? District = null,
    string? City = null,
    UserRole Role = UserRole.Customer
) : IRequest<Result<AuthResponse>>;
