using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Auth.Commands.Register;
using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using Api.Contracts;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

public record UpdateCommissionSettingRequest(decimal Percentage);

[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;

    public AdminController(
        IMediator mediator,
        IUserRepository userRepository,
        IApplicationDbContext context)
    {
        _mediator = mediator;
        _userRepository = userRepository;
        _context = context;
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
        var config = await _context.SystemConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Key == SystemConfiguration.Keys.PlatformCommissionPercentage,
                cancellationToken);

        var value = decimal.TryParse(config?.Value, out var percentage) ? percentage : 10m;
        value = Math.Clamp(value, 0m, 100m);

        return OkResponse(new
        {
            key = SystemConfiguration.Keys.PlatformCommissionPercentage,
            percentage = value,
            description = config?.Description ?? "Mức hoa hồng nền tảng tính trên doanh thu đơn hợp lệ."
        });
    }

    [HttpPatch("system/commission")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCommissionSetting(
        [FromBody] UpdateCommissionSettingRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Percentage < 0 || request.Percentage > 100)
            return BadRequestResponse("Commission percentage must be between 0 and 100.");

        var config = await _context.SystemConfigurations
            .FirstOrDefaultAsync(
                item => item.Key == SystemConfiguration.Keys.PlatformCommissionPercentage,
                cancellationToken);

        var value = request.Percentage.ToString("0.##");
        if (config == null)
        {
            config = SystemConfiguration.Create(
                SystemConfiguration.Keys.PlatformCommissionPercentage,
                value,
                "Mức hoa hồng nền tảng tính trên doanh thu đơn hợp lệ."
            );
            _context.SystemConfigurations.Add(config);
        }
        else
        {
            config.UpdateValue(value);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return OkResponse(new
        {
            key = config.Key,
            percentage = request.Percentage,
            description = config.Description
        }, "Commission setting updated successfully.");
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

    [HttpGet("service-approvals")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServiceApprovals(
        [FromQuery] string status = "pending",
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var showActive = status.Equals("approved", StringComparison.OrdinalIgnoreCase);
        var query = _context.AdditionalServices
            .AsNoTracking()
            .Include(service => service.SportCenter)
            .Where(service => service.IsActive == showActive);

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
                Status = service.IsActive ? "approved" : "pending",
                service.CreatedAt,
                service.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return OkResponse(items);
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

        service.ToggleActive(true);
        _context.Notifications.Add(Notification.Create(
            service.SportCenter.OwnerId,
            NotificationType.SystemAnnouncement,
            "Dịch vụ đã được duyệt",
            $"Dịch vụ {service.Name} đã được admin duyệt và có thể bán kèm khi đặt sân."
        ));

        await _context.SaveChangesAsync(cancellationToken);
        return OkResponse<object?>(null, "Service approved successfully.");
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
            "Dịch vụ chưa được duyệt",
            $"Dịch vụ {service.Name} đã bị gỡ khỏi hệ thống. Vui lòng kiểm tra lại thông tin trước khi tạo mới."
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
