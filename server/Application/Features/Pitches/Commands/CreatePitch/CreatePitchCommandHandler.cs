using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Entities;
using Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Pitches.Commands.CreatePitch;

public class CreatePitchCommandHandler : IRequestHandler<CreatePitchCommand, Result<Guid>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreatePitchCommandHandler> _logger;

    public CreatePitchCommandHandler(
        IPitchRepository pitchRepository,
        IUserRepository userRepository,
        IApplicationDbContext context,
        ILogger<CreatePitchCommandHandler> logger)
    {
        _pitchRepository = pitchRepository;
        _userRepository = userRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreatePitchCommand request, CancellationToken cancellationToken)
    {
        var owner = await _userRepository.GetByIdAsync(request.OwnerId, cancellationToken);
        if (owner == null)
            return Result<Guid>.Failure("Owner not found");

        if (!owner.IsPitchOwner() && !owner.IsAdmin())
            return Result<Guid>.Failure("User is not authorized to create pitches");

        // Tìm SportCenter hiện có của Owner (nếu có)
        var existingPitch = await _context.Pitches
            .FirstOrDefaultAsync(p => p.OwnerId == request.OwnerId, cancellationToken);

        Guid sportCenterId;
        if (existingPitch != null)
        {
            sportCenterId = existingPitch.SportCenterId;
            var sportCenter = await _context.SportCenters
                .FirstOrDefaultAsync(center => center.Id == sportCenterId, cancellationToken);

            if (sportCenter != null && !string.IsNullOrWhiteSpace(request.Address))
            {
                sportCenter.UpdateAddress(BuildAddress(
                    request.Address.Trim(),
                    sportCenter.Address,
                    request.Latitude,
                    request.Longitude));
            }
        }
        else
        {
            var finalAddress = request.Address ?? owner.Address ?? "Địa chỉ trung tâm (Vui lòng cập nhật trong cài đặt)";
            
            // Cố gắng phân tách địa chỉ thông minh hơn
            string city = "Thành phố Hồ Chí Minh"; // Mặc định
            string district = "Quận 1";
            string ward = "Phường 1";
            
            var parts = finalAddress.Split(',').Select(p => p.Trim()).ToList();
            if (parts.Count >= 3)
            {
                city = parts[parts.Count - 1];
                district = parts[parts.Count - 2];
                ward = parts[parts.Count - 3];
            }
            else if (parts.Count == 2)
            {
                city = parts[1];
                district = parts[0];
            }
            else if (parts.Count == 1 && !string.IsNullOrWhiteSpace(parts[0]))
            {
                city = parts[0];
            }

            var sportCenter = new SportCenter(
                "Trung tâm " + owner.FullName,
                owner.Id,
                Address.Create(
                    finalAddress,
                    ward,
                    district,
                    city,
                    request.Latitude ?? 10.762622,
                    request.Longitude ?? 106.660172),
                "Hệ thống tự động khởi tạo",
                owner.PhoneNumber
            );
            _context.SportCenters.Add(sportCenter);
            sportCenterId = sportCenter.Id;
        }

        var pitch = Pitch.Create(
            request.OwnerId,
            sportCenterId,
            request.Name,
            request.PitchType,
            request.IsIndoor,
            request.Description,
            request.MapLink?.Trim()
        );

        // Kích hoạt sân ngay để hiển thị trên trang khám phá
        pitch.Activate();

        // Thêm TimeSlots (Khung giờ)
        if (request.TimeSlots != null && request.TimeSlots.Any())
        {
            foreach (var ts in request.TimeSlots)
            {
                pitch.AddTimeSlot(TimeRange.Create(ts.StartTime, ts.EndTime), Money.Create(ts.Price));
            }
        }
        else
        {
            // Mặc định nếu không có TimeSlot
            pitch.AddTimeSlot(TimeRange.Create(TimeSpan.FromHours(5), TimeSpan.FromHours(23)), Money.Create(200000));
        }

        // Dịch vụ bán kèm hiện được quản lý tập trung ở trang Dịch vụ


        // Thêm Hình ảnh
        if (request.Images != null && request.Images.Any())
        {
            foreach (var img in request.Images)
            {
                if (!string.IsNullOrWhiteSpace(img))
                {
                    pitch.AddImage(img, pitch.Images.Count == 0); // Ảnh đầu tiên là Primary
                }
            }
        }

        await _pitchRepository.AddAsync(pitch, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pitch {PitchId} created by owner {OwnerId}", pitch.Id, request.OwnerId);

        return Result<Guid>.Success(pitch.Id);
    }

    private static Address BuildAddress(string fullAddress, Address currentAddress, double? latitude, double? longitude)
    {
        var parts = fullAddress
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        var city = currentAddress.City;
        var district = currentAddress.District;
        var ward = currentAddress.Ward;

        if (parts.Count >= 3)
        {
            city = parts[^1];
            district = parts[^2];
            ward = parts[^3];
        }
        else if (parts.Count == 2)
        {
            city = parts[^1];
            district = parts[0];
        }
        else if (parts.Count == 1)
        {
            city = parts[0];
        }

        return Address.Create(
            fullAddress,
            ward,
            district,
            city,
            latitude ?? currentAddress.Latitude,
            longitude ?? currentAddress.Longitude);
    }
}
