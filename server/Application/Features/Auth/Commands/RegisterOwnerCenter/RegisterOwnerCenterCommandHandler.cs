using Application.Common.DTOs;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Auth.Commands.RegisterOwnerCenter;

public class RegisterOwnerCenterCommandHandler : IRequestHandler<RegisterOwnerCenterCommand, Result<AuthResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<RegisterOwnerCenterCommandHandler> _logger;

    public RegisterOwnerCenterCommandHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        ILogger<RegisterOwnerCenterCommandHandler> logger)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(RegisterOwnerCenterCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
            return Result<AuthResponse>.Failure("User not found");

        if (user.Role != UserRole.Customer && user.Role != UserRole.PitchOwner)
            return Result<AuthResponse>.Failure("Tài khoản này không thể đăng ký làm chủ sân.");

        var hasSportCenter = await _context.SportCenters
            .AnyAsync(center => center.OwnerId == user.Id, cancellationToken);

        if (hasSportCenter)
            return Result<AuthResponse>.Failure("Tài khoản này đã có hồ sơ sân.");

        var businessName = request.BusinessName.Trim();
        var phoneNumber = request.PhoneNumber.Trim();
        var street = request.Street.Trim();
        var ward = request.Ward.Trim();
        var district = request.District.Trim();
        var city = request.City.Trim();

        if (string.IsNullOrWhiteSpace(businessName))
            return Result<AuthResponse>.Failure("Tên sân là bắt buộc.");

        if (string.IsNullOrWhiteSpace(phoneNumber))
            return Result<AuthResponse>.Failure("Số điện thoại là bắt buộc.");

        if (string.IsNullOrWhiteSpace(street) || string.IsNullOrWhiteSpace(ward) || string.IsNullOrWhiteSpace(district) || string.IsNullOrWhiteSpace(city))
            return Result<AuthResponse>.Failure("Địa chỉ sân là bắt buộc.");

        var fullAddress = $"{street}, {ward}, {district}, {city}";
        user.UpdateProfile(user.FullName, phoneNumber, fullAddress, user.MapLink);

        var sportCenterAddress = Address.Create(street, ward, district, city, 10.0, 106.0);
        var sportCenter = new SportCenter(
            businessName,
            user.Id,
            sportCenterAddress,
            "Cơ sở được tạo từ form đăng ký chủ sân.",
            phoneNumber
        );

        sportCenter.Deactivate();

        _context.SportCenters.Add(sportCenter);
        _context.Notifications.Add(Notification.Create(
            user.Id,
            NotificationType.SystemAnnouncement,
            "Hồ sơ chủ sân đang chờ duyệt",
            "SmartSport đã nhận hồ sơ đăng ký sân của bạn. Bạn sẽ vào được trang quản lý sau khi admin phê duyệt."
        ));
        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtTokenService.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(60);

        _logger.LogInformation("User {UserId} submitted owner center {SportCenterName} for approval", user.Id, businessName);

        return Result<AuthResponse>.Success(new AuthResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.Role,
            token,
            expiresAt
        ));
    }
}
