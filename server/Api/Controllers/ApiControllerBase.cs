using System.Security.Claims;
using Application.Common.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Base controller providing shared functionality for all API controllers.
/// Eliminates duplication and enforces unified response format.
/// </summary>
[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    protected Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")
                       ?? User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            return userId;

        return Guid.Empty;
    }

    protected IActionResult OkResponse<T>(T data, string? message = null)
        => Ok(ApiResponse<T>.SuccessResponse(data, message));

    protected IActionResult CreatedResponse<T>(string actionName, object routeValues, T data, string? message = null)
        => CreatedAtAction(actionName, routeValues, ApiResponse<T>.SuccessResponse(data, message));

    protected IActionResult ErrorResponse(string message, int statusCode = StatusCodes.Status400BadRequest, List<string>? errors = null)
        => StatusCode(statusCode, ApiResponse.FailureResponse(message, errors));

    protected IActionResult BadRequestResponse(string message, List<string>? errors = null)
        => ErrorResponse(message, StatusCodes.Status400BadRequest, errors);

    protected IActionResult NotFoundResponse(string message)
        => ErrorResponse(message, StatusCodes.Status404NotFound);
}
