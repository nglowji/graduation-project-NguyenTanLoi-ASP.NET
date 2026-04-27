using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.AI.Queries.GetDirections;

public record GetDirectionsQuery : IRequest<DirectionsResponse>
{
    public double FromLatitude { get; init; }
    public double FromLongitude { get; init; }
    public Guid ToPitchId { get; init; }
    public string TravelMode { get; init; } = "driving"; // driving, walking, bicycling, transit
}

public class GetDirectionsQueryHandler : IRequestHandler<GetDirectionsQuery, DirectionsResponse>
{
    private readonly IMapService _mapService;
    private readonly IPitchRepository _pitchRepository;

    public GetDirectionsQueryHandler(
        IMapService mapService,
        IPitchRepository pitchRepository)
    {
        _mapService = mapService;
        _pitchRepository = pitchRepository;
    }

    public async Task<DirectionsResponse> Handle(
        GetDirectionsQuery request,
        CancellationToken cancellationToken)
    {
        // Get pitch location
        var pitch = await _pitchRepository.GetByIdAsync(request.ToPitchId, cancellationToken);
        if (pitch == null)
        {
            throw new KeyNotFoundException($"Pitch with ID {request.ToPitchId} not found");
        }

        // Get directions
        var directions = await _mapService.GetDirectionsAsync(
            request.FromLatitude,
            request.FromLongitude,
            pitch.Latitude,
            pitch.Longitude,
            request.TravelMode);

        return directions;
    }
}
