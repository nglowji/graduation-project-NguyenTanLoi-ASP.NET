using Application.Features.AI.Commands.ChatWithAI;
using Application.Features.AI.Queries.GetDirections;
using Application.Features.AI.Queries.GetPitchRecommendations;
using Api.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/ai")]
[Authorize]
public class AIController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public AIController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Chat với AI assistant
    /// </summary>
    [HttpPost("chat")]
    [ProducesResponseType(typeof(ChatWithAIResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Chat(
        [FromBody] ChatRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new ChatWithAICommand
        {
            UserId = userId,
            Message = request.Message,
            SessionId = request.SessionId
        };

        var response = await _mediator.Send(command, cancellationToken);
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
        [FromQuery] double? longitude,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var queryObj = new GetPitchRecommendationsQuery
        {
            UserId = userId,
            Query = query,
            CurrentLatitude = latitude,
            CurrentLongitude = longitude
        };

        var response = await _mediator.Send(queryObj, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Lấy chỉ đường đến sân
    /// </summary>
    [HttpGet("directions")]
    [ProducesResponseType(typeof(Application.Common.Interfaces.DirectionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDirections(
        [FromQuery] double fromLatitude,
        [FromQuery] double fromLongitude,
        [FromQuery] Guid toPitchId,
        [FromQuery] string travelMode = "driving",
        CancellationToken cancellationToken = default)
    {
        var query = new GetDirectionsQuery
        {
            FromLatitude = fromLatitude,
            FromLongitude = fromLongitude,
            ToPitchId = toPitchId,
            TravelMode = travelMode
        };

        var response = await _mediator.Send(query, cancellationToken);
        return Ok(response);
    }
}
