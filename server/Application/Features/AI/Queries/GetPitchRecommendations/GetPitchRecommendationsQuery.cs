using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.AI.Queries.GetPitchRecommendations;

public record GetPitchRecommendationsQuery : IRequest<PitchRecommendationResponse>
{
    public Guid UserId { get; init; }
    public string? Query { get; init; }
    public double? CurrentLatitude { get; init; }
    public double? CurrentLongitude { get; init; }
}

public class GetPitchRecommendationsQueryHandler 
    : IRequestHandler<GetPitchRecommendationsQuery, PitchRecommendationResponse>
{
    private readonly IGeminiAIService _geminiService;
    private readonly IMapService _mapService;
    private readonly IUserPreferenceRepository _preferenceRepository;

    public GetPitchRecommendationsQueryHandler(
        IGeminiAIService geminiService,
        IMapService mapService,
        IUserPreferenceRepository preferenceRepository)
    {
        _geminiService = geminiService;
        _mapService = mapService;
        _preferenceRepository = preferenceRepository;
    }

    public async Task<PitchRecommendationResponse> Handle(
        GetPitchRecommendationsQuery request,
        CancellationToken cancellationToken)
    {
        // Get AI recommendations based on user preferences and query
        var recommendations = await _geminiService.GetPitchRecommendationsAsync(
            request.UserId,
            request.Query);

        // If user provided current location, calculate distances
        if (request.CurrentLatitude.HasValue && request.CurrentLongitude.HasValue)
        {
            var nearbyPitches = await _mapService.FindNearbyPitchesAsync(
                request.CurrentLatitude.Value,
                request.CurrentLongitude.Value,
                radiusKm: 10.0);

            // Enhance recommendations with distance info
            foreach (var rec in recommendations.Recommendations)
            {
                var nearbyPitch = nearbyPitches.FirstOrDefault(p => p.PitchId == rec.PitchId);
                if (nearbyPitch != null)
                {
                    rec.DistanceKm = nearbyPitch.DistanceKm;
                }
            }

            // Re-sort by distance if available
            recommendations.Recommendations = recommendations.Recommendations
                .OrderBy(r => r.DistanceKm ?? double.MaxValue)
                .ThenByDescending(r => r.Score)
                .ToList();
        }

        return recommendations;
    }
}
