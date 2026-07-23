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
            return Result<AuthResponse>.Failure("Tai khoan nay khong the dang ky lam chu san.");

        if (user.HasSubmittedOwnerRegistration)
            return Result<AuthResponse>.Failure("Tai khoan nay da tung gui ho so dang ky chu san.");

        var hasSportCenter = await _context.SportCenters
            .AnyAsync(center => center.OwnerId == user.Id, cancellationToken);

        if (hasSportCenter)
            return Result<AuthResponse>.Failure("Tai khoan nay da co ho so san.");

        var businessName = request.BusinessName.Trim();
        var phoneNumber = request.PhoneNumber.Trim();
        var street = request.Street.Trim();
        var ward = request.Ward.Trim();
        var district = request.District.Trim();
        var city = request.City.Trim();

        if (string.IsNullOrWhiteSpace(businessName))
            return Result<AuthResponse>.Failure("Ten san la bat buoc.");

        if (string.IsNullOrWhiteSpace(phoneNumber))
            return Result<AuthResponse>.Failure("So dien thoai la bat buoc.");

        if (string.IsNullOrWhiteSpace(street) || string.IsNullOrWhiteSpace(ward) || string.IsNullOrWhiteSpace(district) || string.IsNullOrWhiteSpace(city))
            return Result<AuthResponse>.Failure("Dia chi san la bat buoc.");

        var fullAddress = $"{street}, {ward}, {district}, {city}";
        user.MarkOwnerRegistrationSubmitted();
        user.UpdateProfile(user.FullName, phoneNumber, fullAddress, user.MapLink);

        var sportCenterAddress = Address.Create(street, ward, district, city, 10.0, 106.0);
        var sportCenter = new SportCenter(
            businessName,
            user.Id,
            sportCenterAddress,
            "Co so duoc tao tu form dang ky chu san.",
            phoneNumber
        );

        sportCenter.Deactivate();

        _context.SportCenters.Add(sportCenter);
        _context.Notifications.Add(Notification.Create(
            user.Id,
            NotificationType.SystemAnnouncement,
            "Ho so chu san dang cho duyet",
            "SmartSport da nhan ho so dang ky san cua ban. Ban se vao duoc trang quan ly sau khi admin phe duyet."
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
