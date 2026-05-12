using Domain.Enums;

namespace Application.Features.Auth.DTOs;

public record UserProfileDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string? MapLink { get; init; }
    public UserRole Role { get; init; }
    public bool EmailConfirmed { get; init; }
}
