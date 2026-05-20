using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Auth.Commands.RegisterOwnerCenter;

public record RegisterOwnerCenterCommand(
    Guid UserId,
    string BusinessName,
    string PhoneNumber,
    string Street,
    string Ward,
    string District,
    string City
) : IRequest<Result<AuthResponse>>;
