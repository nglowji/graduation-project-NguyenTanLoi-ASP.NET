using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IApplicationDbContext context,
        ILogger<RegisterCommandHandler> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var emailExists = await _userRepository.EmailExistsAsync(request.Email, cancellationToken);
        if (emailExists)
            return Result<AuthResponse>.Failure("Email đã được sử dụng.");

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var isFirstUser = !await _context.Users.AnyAsync(cancellationToken);
        var role = isFirstUser ? UserRole.Admin : request.Role;

        var user = User.Create(
            request.Email,
            request.FullName,
            request.PhoneNumber,
            request.Address,
            passwordHash,
            role
        );

        if (!string.IsNullOrWhiteSpace(request.MapLink))
        {
            user.UpdateProfile(
                request.FullName,
                request.PhoneNumber,
                request.Address,
                request.MapLink.Trim()
            );
        }

        await _userRepository.AddAsync(user, cancellationToken);

        if (role == UserRole.PitchOwner && !string.IsNullOrWhiteSpace(request.BusinessName))
        {
            var sportCenterAddress = Address.Create(
                request.Address?.Trim() ?? "Chưa cập nhật địa chỉ",
                request.Ward?.Trim() ?? "Chưa cập nhật phường/xã",
                request.District?.Trim() ?? "Chưa cập nhật quận/huyện",
                request.City?.Trim() ?? "Chưa cập nhật tỉnh/thành",
                10.0,
                106.0
            );

            var sportCenter = new SportCenter(
                request.BusinessName.Trim(),
                user.Id,
                sportCenterAddress,
                "Cơ sở được tạo từ form đăng ký chủ sân.",
                request.PhoneNumber
            );

            _context.SportCenters.Add(sportCenter);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtTokenService.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(60); // Should match JWT config

        _logger.LogInformation(
            "User {UserId} registered successfully with email {Email} and role {Role}",
            user.Id,
            user.Email,
            user.Role
        );

        var response = new AuthResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.Role,
            token,
            expiresAt
        );

        return Result<AuthResponse>.Success(response);
    }
}
