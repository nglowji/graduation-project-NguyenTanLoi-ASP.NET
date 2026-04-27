using Application.Features.AI.Commands.ChatWithAI;
using Application.Features.AI.Queries.GetDirections;
using Application.Features.AI.Queries.GetPitchRecommendations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/v1/ai")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AIController> _logger;

    public AIController(IMediator mediator, ILogger<AIController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Chat với AI assistant
    /// </summary>
    [HttpPost("chat")]
    [ProducesResponseType(typeof(ChatWithAIResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request)
    {
        var userId = GetUserId();

        var command = new ChatWithAICommand
        {
            UserId = userId,
            Message = request.Message,
            SessionId = request.SessionId
        };

        var response = await _mediator.Send(command);

        return Ok(response);
    }

    /// <summary>
    /// Lấy gợi ý sân dựa trên preferences và AI
    /// </summary>
    [HttpGet("recommendations")]
    [ProducesResponseType(typeof(Application.Common.Interfaces.PitchRecommendationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecommendations(
        [FromQuery] string? query,
        [FromQuery] double? latitude,
        [FromQuery] double? longitude)
    {
        var userId = GetUserId();

        var queryObj = new GetPitchRecommendationsQuery
        {
            UserId = userId,
            Query = query,
            CurrentLatitude = latitude,
            CurrentLongitude = longitude
        };

        var response = await _mediator.Send(queryObj);

        return Ok(response);
    }

    /// <summary>
    /// Lấy chỉ đường đến sân
    /// </summary>
    [HttpGet("directions")]
    [ProducesResponseType(typeof(Application.Common.Interfaces.DirectionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDirections(
        [FromQuery] double fromLatitude,
        [FromQuery] double fromLongitude,
        [FromQuery] Guid toPitchId,
        [FromQuery] string travelMode = "driving")
    {
        var query = new GetDirectionsQuery
        {
            FromLatitude = fromLatitude,
            FromLongitude = fromLongitude,
            ToPitchId = toPitchId,
            TravelMode = travelMode
        };

        var response = await _mediator.Send(query);

        return Ok(response);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}

public record ChatRequest
{
    public string Message { get; init; } = null!;
    public string? SessionId { get; init; }
}
