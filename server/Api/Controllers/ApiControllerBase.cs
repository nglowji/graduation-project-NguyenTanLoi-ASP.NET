using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Base controller providing shared functionality for all API controllers.
/// Eliminates GetCurrentUserId() duplication across controllers.
/// </summary>
[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>
    /// Extracts the current authenticated user's ID from JWT claims.
    /// </summary>
    /// <returns>The user's Guid, or Guid.Empty if not authenticated.</returns>
    protected Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimConstants.UserIdClaimType)
                       ?? User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            return userId;

        return Guid.Empty;
    }

    /// <summary>
    /// Creates a standardized ProblemDetails BadRequest response.
    /// </summary>
    protected IActionResult BadRequestProblem(string title, string? detail) =>
        BadRequest(new ProblemDetails
        {
            Title = title,
            Detail = detail,
            Status = StatusCodes.Status400BadRequest,
            Instance = HttpContext.Request.Path
        });

    /// <summary>
    /// Creates a standardized ProblemDetails NotFound response.
    /// </summary>
    protected IActionResult NotFoundProblem(string title, string? detail) =>
        NotFound(new ProblemDetails
        {
            Title = title,
            Detail = detail,
            Status = StatusCodes.Status404NotFound,
            Instance = HttpContext.Request.Path
        });
}
