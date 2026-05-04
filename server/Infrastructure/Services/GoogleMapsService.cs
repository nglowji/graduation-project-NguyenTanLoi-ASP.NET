using System.Net.Http.Json;
using System.Text.Json;
using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service tương tác với Google Maps API
/// </summary>
public class GoogleMapsService : IMapService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleMapsService> _logger;
    private readonly IPitchRepository _pitchRepository;
    private readonly string _apiKey;

    public GoogleMapsService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GoogleMapsService> logger,
        IPitchRepository pitchRepository)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _pitchRepository = pitchRepository;
        
        _apiKey = configuration["GoogleMaps:ApiKey"] 
            ?? throw new InvalidOperationException("GoogleMaps:ApiKey is not configured");
        
        _httpClient.BaseAddress = new Uri("https://maps.googleapis.com/maps/api/");
    }

    public async Task<double> CalculateDistanceAsync(
        double fromLat, double fromLng,
        double toLat, double toLng)
    {
        try
        {
            // Sử dụng Haversine formula cho tính toán nhanh
            var distance = CalculateHaversineDistance(fromLat, fromLng, toLat, toLng);
            return distance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance");
            throw;
        }
    }

    public async Task<DirectionsResponse> GetDirectionsAsync(
        double fromLat, double fromLng,
        double toLat, double toLng,
        string travelMode = "driving")
    {
        try
        {
            var origin = $"{fromLat},{fromLng}";
            var destination = $"{toLat},{toLng}";
            
            var url = $"directions/json?origin={origin}&destination={destination}" +
                     $"&mode={travelMode.ToLower()}&key={_apiKey}&language=vi";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<GoogleDirectionsResponse>();

            if (result?.Routes == null || !result.Routes.Any())
            {
                throw new InvalidOperationException("No routes found");
            }

            var route = result.Routes.First();
            var leg = route.Legs.First();

            return new DirectionsResponse
            {
                DistanceMeters = leg.Distance.Value,
                DurationSeconds = leg.Duration.Value,
                DistanceText = leg.Distance.Text,
                DurationText = leg.Duration.Text,
                Steps = leg.Steps.Select(s => new DirectionStep
                {
                    Instruction = StripHtmlTags(s.HtmlInstructions),
                    DistanceMeters = s.Distance.Value,
                    DurationSeconds = s.Duration.Value,
                    TravelMode = s.TravelMode
                }).ToList(),
                PolylineEncoded = route.OverviewPolyline.Points
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting directions from Google Maps");
            throw;
        }
    }

    public async Task<List<NearbyPitch>> FindNearbyPitchesAsync(
        double latitude, double longitude,
        double radiusKm = 5.0)
    {
        try
        {
            // Lấy tất cả pitches và filter theo khoảng cách
            var allPitches = await _pitchRepository.GetAllAsync();
            
            var nearbyPitches = allPitches
                .Select(p => new
                {
                    Pitch = p,
                    Distance = CalculateHaversineDistance(
                        latitude, longitude,
                        p.Address.Latitude, p.Address.Longitude)
                })
                .Where(x => x.Distance <= radiusKm)
                .OrderBy(x => x.Distance)
                .Select(x => new NearbyPitch
                {
                    PitchId = x.Pitch.Id,
                    Name = x.Pitch.Name,
                    DistanceKm = Math.Round(x.Distance, 2),
                    Latitude = x.Pitch.Address.Latitude,
                    Longitude = x.Pitch.Address.Longitude
                })
                .ToList();

            return nearbyPitches;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding nearby pitches");
            throw;
        }
    }

    public async Task<GeocodingResult> GeocodeAddressAsync(string address)
    {
        try
        {
            var url = $"geocode/json?address={Uri.EscapeDataString(address)}&key={_apiKey}&language=vi";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<GoogleGeocodingResponse>();

            if (result?.Results == null || !result.Results.Any())
            {
                throw new InvalidOperationException($"Address not found: {address}");
            }

            var location = result.Results.First();

            return new GeocodingResult
            {
                Latitude = location.Geometry.Location.Lat,
                Longitude = location.Geometry.Location.Lng,
                FormattedAddress = location.FormattedAddress
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error geocoding address: {Address}", address);
            throw;
        }
    }

    public async Task<string> ReverseGeocodeAsync(double latitude, double longitude)
    {
        try
        {
            var latlng = $"{latitude},{longitude}";
            var url = $"geocode/json?latlng={latlng}&key={_apiKey}&language=vi";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<GoogleGeocodingResponse>();

            if (result?.Results == null || !result.Results.Any())
            {
                return $"{latitude}, {longitude}";
            }

            return result.Results.First().FormattedAddress;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reverse geocoding: {Lat}, {Lng}", latitude, longitude);
            return $"{latitude}, {longitude}";
        }
    }

    // Private helper methods
    private double CalculateHaversineDistance(
        double lat1, double lon1,
        double lat2, double lon2)
    {
        const double R = 6371; // Earth radius in kilometers

        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        var distance = R * c;

        return distance;
    }

    private double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }

    private string StripHtmlTags(string html)
    {
        if (string.IsNullOrEmpty(html))
            return string.Empty;

        // Simple HTML tag removal
        return System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", string.Empty);
    }
}

// Google Maps API Response Models
internal class GoogleDirectionsResponse
{
    public List<Route> Routes { get; set; } = new();
    public string Status { get; set; } = null!;
}

internal class Route
{
    public List<Leg> Legs { get; set; } = new();
    public OverviewPolyline OverviewPolyline { get; set; } = null!;
}

internal class Leg
{
    public Distance Distance { get; set; } = null!;
    public Duration Duration { get; set; } = null!;
    public List<Step> Steps { get; set; } = new();
}

internal class Step
{
    public Distance Distance { get; set; } = null!;
    public Duration Duration { get; set; } = null!;
    public string HtmlInstructions { get; set; } = null!;
    public string TravelMode { get; set; } = null!;
}

internal class Distance
{
    public string Text { get; set; } = null!;
    public double Value { get; set; }
}

internal class Duration
{
    public string Text { get; set; } = null!;
    public int Value { get; set; }
}

internal class OverviewPolyline
{
    public string Points { get; set; } = null!;
}

internal class GoogleGeocodingResponse
{
    public List<GeocodingResult_Internal> Results { get; set; } = new();
    public string Status { get; set; } = null!;
}

internal class GeocodingResult_Internal
{
    public string FormattedAddress { get; set; } = null!;
    public Geometry Geometry { get; set; } = null!;
}

internal class Geometry
{
    public Location Location { get; set; } = null!;
}

internal class Location
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}
