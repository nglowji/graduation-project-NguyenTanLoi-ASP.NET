using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Auth.Commands.Register;
using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using Api.Contracts;
using Domain.Entities;
using Domain.Enums;
using Domain.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

public record UpdateCommissionSettingRequest(decimal Percentage);
public record UpdateBookingHoldSettingRequest(int Minutes);

internal static class SystemSettingDescriptions
{
    public const string PlatformCommissionPercentage = "Platform commission percentage applied to valid booking revenue.";
    public const string BookingLockDurationMinutes = "How many minutes a selected time slot is held during checkout.";
}

[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;
    private readonly ISystemSettingService _settingService;

    public AdminController(
        IMediator mediator,
        IUserRepository userRepository,
        IApplicationDbContext context,
        ISystemSettingService settingService)
    {
        _mediator = mediator;
        _userRepository = userRepository;
        _context = context;
        _settingService = settingService;
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminUserDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int? role,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminUsersQuery(search, role, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get users");

        return OkResponse(result.Value);
    }

    [HttpPost("users")]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser(
        [FromBody] AdminCreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(typeof(UserRole), request.Role))
            return BadRequestResponse("Invalid role");

        var command = new RegisterCommand(
            request.Email,
            request.Password,
            request.FullName,
            request.PhoneNumber,
            request.Address,
            Role: (UserRole)request.Role
        );

        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess || result.Value == null)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to create user");

        return OkResponse(result.Value.UserId, "User created successfully");
    }

    [HttpDelete("users/{userId:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
            return NotFoundResponse("User not found");

        if (user.Role == UserRole.Admin)
            return BadRequestResponse("Cannot delete admin user");

        await _userRepository.DeleteAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return OkResponse<object?>(null, "User deleted successfully");
    }

    [HttpPatch("users/{userId:guid}/suspend")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SuspendUser(Guid userId, CancellationToken cancellationToken = default)
    {
        var command = new SuspendUserCommand(userId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to update user status");

        return OkResponse<object?>(null, "User status updated successfully.");
    }

    [HttpGet("system/commission")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCommissionSetting(CancellationToken cancellationToken = default)
    {
        var value = await _settingService.GetDecimalAsync(
            SystemConfiguration.Keys.PlatformCommissionPercentage,
            10m,
            0m,
            100m,
            cancellationToken);

        return OkResponse(new
        {
            key = SystemConfiguration.Keys.PlatformCommissionPercentage,
            percentage = value,
            description = SystemSettingDescriptions.PlatformCommissionPercentage
        });
    }

    [HttpPatch("system/commission")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCommissionSetting(
        [FromBody] UpdateCommissionSettingRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var config = await _settingService.UpsertDecimalAsync(
                SystemConfiguration.Keys.PlatformCommissionPercentage,
                request.Percentage,
                0m,
                100m,
                SystemSettingDescriptions.PlatformCommissionPercentage,
                cancellationToken);

            return OkResponse(new
            {
                key = config.Key,
                percentage = request.Percentage,
                description = config.Description
            }, "Commission setting updated successfully.");
        }
        catch (DomainException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }


    [HttpGet("system/booking-hold")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingHoldSetting(CancellationToken cancellationToken = default)
    {
        var minutes = await _settingService.GetIntAsync(
            SystemConfiguration.Keys.BookingLockDurationMinutes,
            10,
            1,
            60,
            cancellationToken);

        return OkResponse(new
        {
            key = SystemConfiguration.Keys.BookingLockDurationMinutes,
            minutes,
            description = SystemSettingDescriptions.BookingLockDurationMinutes
        });
    }

    [HttpPatch("system/booking-hold")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateBookingHoldSetting(
        [FromBody] UpdateBookingHoldSettingRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var config = await _settingService.UpsertIntAsync(
                SystemConfiguration.Keys.BookingLockDurationMinutes,
                request.Minutes,
                1,
                60,
                SystemSettingDescriptions.BookingLockDurationMinutes,
                cancellationToken);

            return OkResponse(new
            {
                key = config.Key,
                minutes = request.Minutes,
                description = config.Description
            }, "Booking hold setting updated successfully.");
        }
        catch (DomainException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    [HttpGet("pitch-approvals")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PitchApprovalDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPitchApprovals(
        [FromQuery] string status = "pending",
        CancellationToken cancellationToken = default)
    {
        var query = new GetPitchApprovalsQuery(status);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get pitch approvals");

        return OkResponse(result.Value);
    }

    [HttpGet("owner-approvals")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOwnerApprovals(
        [FromQuery] string status = "pending",
        CancellationToken cancellationToken = default)
    {
        var normalized = status.Trim().ToLowerInvariant();
        var query = _context.SportCenters
            .AsNoTracking()
            .Join(
                _context.Users.AsNoTracking(),
                center => center.OwnerId,
                user => user.Id,
                (center, user) => new { center, user });

        query = normalized switch
        {
            "approved" => query.Where(item =>
                item.center.IsActive && item.user.Role == UserRole.PitchOwner),
            "pending" => query.Where(item =>
                !item.center.IsActive && item.user.Role == UserRole.Customer),
            _ => query.Where(_ => false)
        };

        var registrations = await query
            .OrderByDescending(item => item.center.CreatedAt)
            .Take(80)
            .ToListAsync(cancellationToken);

        var items = registrations.Select(item => new
        {
            id = item.center.Id,
            businessName = item.center.Name,
            applicantName = item.user.FullName,
            applicantEmail = item.user.Email,
            applicantPhone = item.user.PhoneNumber,
            address = item.center.Address.GetFullAddress(),
            submittedAt = item.center.CreatedAt,
            status = item.center.IsActive ? "approved" : "pending"
        }).ToList();

        return OkResponse(items);
    }

    [HttpPatch("owner-approvals/{id:guid}/approve")]
    public async Task<IActionResult> ApproveOwner(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new ApprovePitchCommand(id), cancellationToken);
        return result.IsSuccess
            ? OkResponse<object?>(null, "Owner registration approved.")
            : BadRequestResponse(result.ErrorMessage ?? "Failed to approve owner registration.");
    }

    [HttpPatch("owner-approvals/{id:guid}/reject")]
    public async Task<IActionResult> RejectOwner(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new RejectPitchCommand(id), cancellationToken);
        return result.IsSuccess
            ? OkResponse<object?>(null, "Owner registration rejected.")
            : BadRequestResponse(result.ErrorMessage ?? "Failed to reject owner registration.");
    }

    [HttpPatch("pitch-approvals/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApprovePitch(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ApprovePitchCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to approve pitch");

        return OkResponse<object?>(null, "Pitch approved successfully.");
    }

    [HttpPatch("pitch-approvals/{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectPitch(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new RejectPitchCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to reject pitch");

        return OkResponse<object?>(null, "Pitch registration rejected.");
    }

    [HttpPatch("pitch-approvals/{id:guid}/hide")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> HidePitch(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new HidePitchCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to hide pitch");

        return OkResponse<object?>(null, "Pitch hidden successfully.");
    }

    [HttpGet("service-approvals")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServiceApprovals(
        [FromQuery] string status = "pending",
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}".TrimEnd('/');
        var normalizedStatus = status.Trim().ToLowerInvariant();
        var query = _context.AdditionalServices
            .AsNoTracking()
            .Include(service => service.SportCenter)
            .AsQueryable();

        query = normalizedStatus switch
        {
            "approved" => query.Where(service => service.Status == AdditionalServiceStatus.Active),
            "pending" => query.Where(service => service.Status == AdditionalServiceStatus.PendingApproval),
            "hidden" => query.Where(service => service.Status == AdditionalServiceStatus.Hidden),
            _ => query.Where(_ => false)
        };

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(service =>
                service.Name.ToLower().Contains(keyword) ||
                service.SportCenter.Name.ToLower().Contains(keyword));
        }

        var items = await query
            .OrderByDescending(service => service.UpdatedAt)
            .ThenByDescending(service => service.CreatedAt)
            .Take(80)
            .Select(service => new
            {
                service.Id,
                service.Name,
                Price = service.Price.Amount,
                service.Icon,
                service.ImageUrl,
                service.StockQuantity,
                SportCenterName = service.SportCenter.Name,
                OwnerId = service.SportCenter.OwnerId,
                Status = service.Status == AdditionalServiceStatus.PendingApproval
                    ? "pending"
                    : service.Status == AdditionalServiceStatus.Hidden
                        ? "hidden"
                        : "approved",
                service.CreatedAt,
                service.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var normalized = items
            .Select(service => new
            {
                service.Id,
                service.Name,
                service.Price,
                service.Icon,
                ImageUrl = BuildAbsoluteUrl(service.ImageUrl, baseUrl),
                service.StockQuantity,
                service.SportCenterName,
                service.OwnerId,
                service.Status,
                service.CreatedAt,
                service.UpdatedAt
            })
            .ToList();

        return OkResponse(normalized);
    }

    private static string? BuildAbsoluteUrl(string? imageUrl, string baseUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return null;

        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out _))
            return imageUrl;

        if (imageUrl.StartsWith("/", StringComparison.Ordinal))
            return $"{baseUrl}{imageUrl}";

        return $"{baseUrl}/{imageUrl}";
    }

    [HttpPatch("service-approvals/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveService(Guid id, CancellationToken cancellationToken = default)
    {
        var service = await _context.AdditionalServices
            .Include(item => item.SportCenter)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (service == null)
            return NotFoundResponse("Service not found");

        service.Approve();
        _context.Notifications.Add(Notification.Create(
            service.SportCenter.OwnerId,
            NotificationType.SystemAnnouncement,
            "Dá»‹ch vá»¥ Ä‘Ă£ Ä‘Æ°á»£c duyá»‡t",
            $"Dá»‹ch vá»¥ {service.Name} Ä‘Ă£ Ä‘Æ°á»£c admin duyá»‡t vĂ  cĂ³ thá»ƒ bĂ¡n kĂ¨m khi Ä‘áº·t sĂ¢n."
        ));

        await _context.SaveChangesAsync(cancellationToken);
        return OkResponse<object?>(null, "Service approved successfully.");
    }

    [HttpPatch("service-approvals/{id:guid}/hide")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> HideService(Guid id, CancellationToken cancellationToken = default)
    {
        var service = await _context.AdditionalServices
            .Include(item => item.SportCenter)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (service == null)
            return NotFoundResponse("Service not found");

        service.ToggleActive(false);
        _context.Notifications.Add(Notification.Create(
            service.SportCenter.OwnerId,
            NotificationType.SystemAnnouncement,
            "Dịch vụ đã được tạm ẩn",
            $"Dịch vụ {service.Name} đã được admin tạm ẩn và sẽ không hiển thị khi khách đặt sân."
        ));

        await _context.SaveChangesAsync(cancellationToken);
        return OkResponse<object?>(null, "Service hidden successfully.");
    }

    [HttpDelete("service-approvals/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteService(Guid id, CancellationToken cancellationToken = default)
    {
        var service = await _context.AdditionalServices
            .Include(item => item.SportCenter)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (service == null)
            return NotFoundResponse("Service not found");

        _context.Notifications.Add(Notification.Create(
            service.SportCenter.OwnerId,
            NotificationType.SystemAnnouncement,
            "Dá»‹ch vá»¥ chÆ°a Ä‘Æ°á»£c duyá»‡t",
            $"Dá»‹ch vá»¥ {service.Name} Ä‘Ă£ bá»‹ gá»¡ khá»i há»‡ thá»‘ng. Vui lĂ²ng kiá»ƒm tra láº¡i thĂ´ng tin trÆ°á»›c khi táº¡o má»›i."
        ));
        _context.AdditionalServices.Remove(service);

        await _context.SaveChangesAsync(cancellationToken);
        return OkResponse<object?>(null, "Service deleted successfully.");
    }

    [HttpGet("reviews")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReviews(
        [FromQuery] string? search,
        [FromQuery] int? rating,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(pageNumber, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _context.Reviews
            .AsNoTracking()
            .Include(review => review.User)
            .Include(review => review.Pitch)
                .ThenInclude(pitch => pitch.SportCenter)
            .AsQueryable();

        if (rating is >= 1 and <= 5)
            query = query.Where(review => review.Rating == rating.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(review =>
                review.Comment != null && review.Comment.ToLower().Contains(keyword) ||
                review.User.FullName.ToLower().Contains(keyword) ||
                review.Pitch.Name.ToLower().Contains(keyword) ||
                review.Pitch.SportCenter.Name.ToLower().Contains(keyword));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(review => review.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(review => new
            {
                review.Id,
                review.Rating,
                review.Comment,
                review.OwnerReply,
                review.CreatedAt,
                UserName = review.User.FullName,
                UserEmail = review.User.Email,
                PitchId = review.PitchId,
                PitchName = review.Pitch.Name,
                PitchType = review.Pitch.Type.ToString(),
                SportCenterName = review.Pitch.SportCenter.Name
            })
            .ToListAsync(cancellationToken);

        return OkResponse(new PagedResult<object>(items.Cast<object>().ToList(), total, pageNumber, pageSize));
    }

    [HttpDelete("reviews/{reviewId:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteReview(Guid reviewId, CancellationToken cancellationToken = default)
    {
        var review = await _context.Reviews.FirstOrDefaultAsync(item => item.Id == reviewId, cancellationToken);
        if (review == null)
            return NotFoundResponse("Review not found");

        var pitchId = review.PitchId;
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync(cancellationToken);

        var pitch = await _context.Pitches.FirstOrDefaultAsync(item => item.Id == pitchId, cancellationToken);
        if (pitch != null)
        {
            var stats = await _context.Reviews
                .Where(item => item.PitchId == pitchId)
                .GroupBy(item => item.PitchId)
                .Select(group => new { Count = group.Count(), Average = group.Average(item => item.Rating) })
                .FirstOrDefaultAsync(cancellationToken);

            pitch.SetRatingSnapshot(stats == null ? 0m : (decimal)stats.Average, stats?.Count ?? 0);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return OkResponse<object?>(null, "Review deleted successfully.");
    }
}
