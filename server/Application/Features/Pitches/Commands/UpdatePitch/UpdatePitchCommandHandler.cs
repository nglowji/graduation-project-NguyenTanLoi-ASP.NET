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
                .Include(p => p.TimeSlots)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

            if (pitch == null)
                return Result<Unit>.Failure("Sân không tồn tại.");

            if (pitch.OwnerId != request.OwnerId)
                return Result<Unit>.Failure("Bạn không có quyền cập nhật sân này.");

            // ── 1. Cập nhật thông tin cơ bản ──────────────────────────────────────
            pitch.UpdateInfo(request.Name, request.PitchType, request.IsIndoor, request.Description);

            // ── 2. Cập nhật khung giờ (TimeSlots) ─────────────────────────────────
            if (request.TimeSlots != null)
            {
                // Ở đây ta đơn giản hóa bằng cách deactivate toàn bộ slot hiện tại 
                // và thêm mới những cái trong request. 
                // EF Core sẽ tự động quản lý state của các slot này.
                
                // Lấy các slot đang hoạt động
                var activeSlots = pitch.TimeSlots.Where(ts => ts.IsActive).ToList();
                foreach (var slot in activeSlots)
                {
                    slot.Deactivate();
                }

                // Thêm slot mới từ request
                foreach (var ts in request.TimeSlots)
                {
                    pitch.AddTimeSlot(TimeRange.Create(ts.StartTime, ts.EndTime), Money.Create(ts.Price));
                }
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
                    _context.PitchImages.Remove(img);
                }

                // Tìm các ảnh cần thêm (có trong request nhưng chưa có trong DB)
                var currentUrls = currentImages.Select(i => i.ImageUrl).ToList();
                var urlsToAdd = newUrls.Where(url => !currentUrls.Contains(url)).ToList();

                foreach (var url in urlsToAdd)
                {
                    pitch.AddImage(url, pitch.Images.Count(img => !imagesToRemove.Contains(img)) == 0);
                }

                var remainingImages = pitch.Images
                    .Where(img => !imagesToRemove.Contains(img))
                    .ToList();
                var primaryUrl = newUrls.FirstOrDefault();
                var primaryImage = remainingImages.FirstOrDefault(img => img.ImageUrl == primaryUrl);

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
}
