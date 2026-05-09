using Domain.Enums;

namespace Application.Common.DTOs;

public record AuthResponse(
    Guid UserId,
    string Email,
    string FullName,
    UserRole Role,
    string Token,
    DateTime ExpiresAt
);
