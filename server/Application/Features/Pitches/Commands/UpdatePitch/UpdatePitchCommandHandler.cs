using Application.Common;
using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Exceptions;
using Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
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
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Load pitch WITH related data to ensure tracking
            var pitch = await _context.Pitches
                .Include(p => p.SportCenter)
                .Include(p => p.TimeSlots)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

            if (pitch == null)
                return Result<Unit>.Failure("Sân không tồn tại.");

            if (pitch.OwnerId != request.OwnerId)
                return Result<Unit>.Failure("Bạn không có quyền cập nhật sân này.");

            // ── 1. Cập nhật thông tin cơ bản ──────────────────────────────────────
            pitch.UpdateInfo(pitch.SportCenter?.Name ?? request.Name, request.PitchType, request.IsIndoor, request.Description, request.MapLink?.Trim());

            if (!string.IsNullOrWhiteSpace(request.Address) && pitch.SportCenter != null)
            {
                pitch.SportCenter.UpdateAddress(AddressBuilder.FromFullAddress(
                    request.Address.Trim(),
                    pitch.SportCenter.Address,
                    request.Latitude,
                    request.Longitude));
            }

            // ── 2. Cập nhật khung giờ (TimeSlots) ─────────────────────────────────
            if (request.TimeSlots != null)
            {
                // Ở đây ta đơn giản hóa bằng cách deactivate toàn bộ slot hiện tại 
                // và thêm mới những cái trong request. 
                // EF Core sẽ tự động quản lý state của các slot này.
                
                // Lấy các slot đang hoạt động
                SynchronizeTimeSlots(pitch, request.TimeSlots);

                // Thêm slot mới từ request
            }

            // ── 3. Cập nhật hình ảnh (Images) ────────────────────────────────────
            if (request.Images != null)
            {
                var newUrls = request.Images
                    .Where(u => !string.IsNullOrWhiteSpace(u))
                    .Select(u => u.Trim())
                    .Distinct()
                    .ToList();
                
                // Tìm các ảnh cần xóa (có trong DB nhưng không có trong request)
                var currentImages = pitch.Images.ToList();
                var imagesToRemove = currentImages.Where(img => !newUrls.Contains(img.ImageUrl)).ToList();
                
                foreach (var img in imagesToRemove)
                {
                    // Xóa hẳn khỏi DB (hard delete) hoặc soft delete tùy bạn. 
                    // Ở đây ta dùng Remove để tránh lỗi tracking "another instance is tracked".
                    img.SoftDelete();
                }

                // Tìm các ảnh cần thêm (có trong request nhưng chưa có trong DB)
                var currentUrls = currentImages
                    .Where(img => !img.IsDeleted)
                    .Select(i => i.ImageUrl)
                    .ToList();
                var urlsToAdd = newUrls.Where(url => !currentUrls.Contains(url)).ToList();

                foreach (var url in urlsToAdd)
                {
                    var newImage = pitch.AddImage(url, pitch.Images.Count(img => !img.IsDeleted && !imagesToRemove.Contains(img)) == 0);
                    _context.PitchImages.Add(newImage);
                }

                var remainingImages = pitch.Images
                    .Where(img => !img.IsDeleted && !imagesToRemove.Contains(img))
                    .ToList();
                var primaryUrl = newUrls.FirstOrDefault();
                var primaryImage = remainingImages.FirstOrDefault(img => img.ImageUrl == primaryUrl);

                foreach (var img in remainingImages)
                {
                    var order = newUrls.IndexOf(img.ImageUrl);
                    if (order >= 0)
                    {
                        img.UpdateDisplayOrder(order);
                    }
                }

                if (primaryImage != null)
                {
                    foreach (var img in remainingImages)
                    {
                        img.SetAsSecondary();
                    }

                    primaryImage.SetAsPrimary();
                }
            }

            // ── 4. Lưu thay đổi ──────────────────────────────────────────────────
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Pitch {PitchId} updated successfully", pitch.Id);
            return Result<Unit>.Success(MediatR.Unit.Value);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Concurrency error updating pitch {PitchId}", request.Id);
            return Result<Unit>.Failure("Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang.");
        }
        catch (DomainException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogWarning(ex, "Validation failed for pitch {PitchId}: {Message}", request.Id, ex.Message);
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Unexpected error updating pitch {PitchId}", request.Id);
            return Result<Unit>.Failure($"Lỗi hệ thống: {ex.Message}");
        }
    }

    private void SynchronizeTimeSlots(Domain.Entities.Pitch pitch, List<PitchTimeSlotRequest> requestedSlots)
    {
        var normalizedRequests = requestedSlots
            .GroupBy(slot => new { slot.StartTime, slot.EndTime })
            .Select(group => group.Last())
            .ToList();

        var activeSlots = pitch.TimeSlots.Where(slot => slot.IsActive).ToList();
        var matchedSlotIds = new HashSet<Guid>();

        foreach (var requestedSlot in normalizedRequests)
        {
            var existingSlot = activeSlots.FirstOrDefault(slot =>
                slot.TimeRange.StartTime == requestedSlot.StartTime &&
                slot.TimeRange.EndTime == requestedSlot.EndTime);

            if (existingSlot != null)
            {
                existingSlot.UpdatePrice(Money.Create(requestedSlot.Price));
                matchedSlotIds.Add(existingSlot.Id);
                continue;
            }

            var newSlot = pitch.AddTimeSlot(
                TimeRange.Create(requestedSlot.StartTime, requestedSlot.EndTime),
                Money.Create(requestedSlot.Price));
            _context.TimeSlots.Add(newSlot);
        }

        foreach (var slot in activeSlots.Where(slot => !matchedSlotIds.Contains(slot.Id)))
        {
            slot.Deactivate();
        }
    }

}
