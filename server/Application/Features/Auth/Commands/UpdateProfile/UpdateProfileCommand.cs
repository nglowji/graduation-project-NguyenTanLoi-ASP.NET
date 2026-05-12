using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Auth.Commands.UpdateProfile;

public record UpdateProfileCommand : IRequest<Result<Unit>>
{
    public Guid UserId { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string? MapLink { get; init; }
}
