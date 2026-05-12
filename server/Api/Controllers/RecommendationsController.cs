using Application.Common.DTOs;
using Application.Features.Pitches.DTOs;
using Application.Features.Recommendations.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
public class RecommendationsController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public RecommendationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("personalized")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<PitchDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPersonalizedRecommendations(
        [FromQuery] int limit = 5,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var query = new GetPersonalizedRecommendationsQuery(userId, limit);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get recommendations");

        return OkResponse(result.Value);
    }
}
