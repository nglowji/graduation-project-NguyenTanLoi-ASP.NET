using Application.Common;
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
        string sportCenterName;
        if (existingPitch != null)
        {
            sportCenterId = existingPitch.SportCenterId;
            var sportCenter = await _context.SportCenters
                .FirstOrDefaultAsync(center => center.Id == sportCenterId, cancellationToken);

            if (sportCenter != null && !string.IsNullOrWhiteSpace(request.Address))
            {
                sportCenter.UpdateAddress(AddressBuilder.FromFullAddress(
                    request.Address.Trim(),
                    sportCenter.Address,
                    request.Latitude,
                    request.Longitude));
            }
            sportCenterName = sportCenter?.Name ?? request.Name;
        }
        else
        {
            var finalAddress = request.Address ?? owner.Address ?? "Địa chỉ trung tâm (Vui lòng cập nhật trong cài đặt)";
            var defaultAddress = Address.Create(
                "Địa chỉ trung tâm",
                string.Empty,
                string.Empty,
                "Thành phố Hồ Chí Minh",
                10.762622,
                106.660172);

            var sportCenter = new SportCenter(
                "Trung tâm " + owner.FullName,
                owner.Id,
                AddressBuilder.FromFullAddress(
                    finalAddress,
                    defaultAddress,
                    request.Latitude,
                    request.Longitude,
                    10.762622,
                    106.660172),
                "Hệ thống tự động khởi tạo",
                owner.PhoneNumber
            );
            _context.SportCenters.Add(sportCenter);
            sportCenterId = sportCenter.Id;
            sportCenterName = sportCenter.Name;
        }

        var pitch = Pitch.Create(
            request.OwnerId,
            sportCenterId,
            sportCenterName,
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

}
