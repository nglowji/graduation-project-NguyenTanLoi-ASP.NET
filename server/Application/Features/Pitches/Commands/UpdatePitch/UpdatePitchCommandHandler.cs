using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Pitches.Commands.UpdatePitch;

public class UpdatePitchCommandHandler : IRequestHandler<UpdatePitchCommand, Result<Unit>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<UpdatePitchCommandHandler> _logger;

    public UpdatePitchCommandHandler(
        IPitchRepository pitchRepository,
        IApplicationDbContext context,
        ILogger<UpdatePitchCommandHandler> logger)
    {
        _pitchRepository = pitchRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(UpdatePitchCommand request, CancellationToken cancellationToken)
    {
        var pitch = await _pitchRepository.GetByIdAsync(request.Id, cancellationToken);
        if (pitch == null)
            return Result<Unit>.Failure("Pitch not found");

        if (pitch.OwnerId != request.OwnerId)
            return Result<Unit>.Failure("You are not authorized to update this pitch");

        pitch.UpdateInfo(request.Name, request.PitchType, request.IsIndoor, request.Description);

        // Cập nhật Khung giờ (Xóa cũ thêm mới)
        if (request.TimeSlots != null && request.TimeSlots.Any())
        {
            pitch.ClearTimeSlots();
            foreach (var ts in request.TimeSlots)
            {
                pitch.AddTimeSlot(TimeRange.Create(ts.StartTime, ts.EndTime), Money.Create(ts.Price));
            }
        }

        // Cập nhật Hình ảnh (Xóa cũ thêm mới)
        if (request.Images != null && request.Images.Any())
        {
            pitch.ClearImages();
            foreach (var img in request.Images)
            {
                if (!string.IsNullOrWhiteSpace(img))
                {
                    pitch.AddImage(img, pitch.Images.Count == 0);
                }
            }
        }

        // Dịch vụ hiện được quản lý ở trang riêng


        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Pitch {PitchId} updated by owner {OwnerId}", pitch.Id, request.OwnerId);

        return Result<Unit>.Success(MediatR.Unit.Value);
    }
}
