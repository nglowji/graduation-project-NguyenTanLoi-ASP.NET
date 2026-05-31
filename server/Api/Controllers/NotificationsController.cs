using Api.Contracts;
using Application.Common.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Application.Common.Interfaces;

namespace Api.Controllers;

[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;

    public NotificationsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<NotificationResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var notifications = await _context.Notifications
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .Take(50)
            .Select(item => new NotificationResponse(
                item.Id,
                item.Type.ToString(),
                item.Title,
                item.Message,
                item.IsRead,
                item.CreatedAt.ToString("o")
            ))
            .ToListAsync(cancellationToken);

        return OkResponse(notifications);
    }

    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken);

        if (notification == null)
            return NotFoundResponse("Notification not found");

        notification.MarkAsRead();
        await _context.SaveChangesAsync(cancellationToken);

        return OkResponse<object?>(null, "Notification marked as read");
    }
}
