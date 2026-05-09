using System.Net.Http.Json;
using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class GoogleMapsService : IMapService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleMapsService> _logger;
    private readonly string _apiKey;

    public GoogleMapsService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GoogleMapsService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _apiKey = configuration["GoogleMaps:ApiKey"] 
            ?? throw new InvalidOperationException("GoogleMaps:ApiKey is not configured");
        
        _httpClient.BaseAddress = new Uri("https://maps.googleapis.com/maps/api/");
    }

    public async Task<double> CalculateDistanceAsync(double fromLat, double fromLng, double toLat, double toLng)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"distancematrix/json?origins={fromLat},{fromLng}&destinations={toLat},{toLng}&key={_apiKey}");
            
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<DistanceMatrixResponse>();
            
            var distance = result?.Rows?.FirstOrDefault()?.Elements?.FirstOrDefault()?.Distance?.Value ?? 0;
            return distance / 1000.0; // Return in KM
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance via Google Maps");
            return 0;
        }
    }

    public async Task<DirectionsResponse> GetDirectionsAsync(double fromLat, double fromLng, double toLat, double toLng, string travelMode = "driving")
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"directions/json?origin={fromLat},{fromLng}&destination={toLat},{toLng}&mode={travelMode}&key={_apiKey}");
            
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<GoogleDirectionsResponse>();

            if (result?.Routes == null || !result.Routes.Any())
                return new DirectionsResponse();

            var route = result.Routes[0];
            var leg = route.Legs.FirstOrDefault();

            return new DirectionsResponse
            {
                DistanceMeters = leg?.Distance?.Value ?? 0,
                DurationSeconds = leg?.Duration?.Value ?? 0,
                DistanceText = leg?.Distance?.Text ?? "",
                DurationText = leg?.Duration?.Text ?? "",
                PolylineEncoded = route.OverviewPolyline?.Points ?? "",
                Steps = leg?.Steps?.Select(s => new DirectionStep
                {
                    Instruction = s.HtmlInstructions ?? "",
                    DistanceMeters = s.Distance?.Value ?? 0,
                    DurationSeconds = s.Duration?.Value ?? 0,
                    TravelMode = s.TravelMode ?? ""
                }).ToList() ?? new List<DirectionStep>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting directions via Google Maps");
            return new DirectionsResponse();
        }
    }

    public Task<List<NearbyPitch>> FindNearbyPitchesAsync(double latitude, double longitude, double radiusKm = 5.0)
    {
        // This would typically involve querying our database with spatial coordinates
        // The implementation here is a placeholder as the actual logic resides in the repository
        return Task.FromResult(new List<NearbyPitch>());
    }

    public async Task<GeocodingResult> GeocodeAddressAsync(string address)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"geocode/json?address={Uri.EscapeDataString(address)}&key={_apiKey}");
            
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<GoogleGeocodingResponse>();

            var location = result?.Results?.FirstOrDefault()?.Geometry?.Location;
            return new GeocodingResult
            {
                Latitude = location?.Lat ?? 0,
                Longitude = location?.Lng ?? 0,
                FormattedAddress = result?.Results?.FirstOrDefault()?.FormattedAddress ?? ""
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error geocoding address via Google Maps");
            return new GeocodingResult();
        }
    }

    public async Task<string> ReverseGeocodeAsync(double latitude, double longitude)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"geocode/json?latlng={latitude},{longitude}&key={_apiKey}");
            
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<GoogleGeocodingResponse>();

            return result?.Results?.FirstOrDefault()?.FormattedAddress ?? "Unknown Address";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reverse geocoding via Google Maps");
            return "Unknown Address";
        }
    }
}

// Internal models for Google Maps API responses
internal class DistanceMatrixResponse
{
    public List<DistanceRow>? Rows { get; set; }
}

internal class DistanceRow
{
    public List<DistanceElement>? Elements { get; set; }
}

internal class DistanceElement
{
    public DistanceValue? Distance { get; set; }
}

internal class DistanceValue
{
    public int Value { get; set; }
    public string? Text { get; set; }
}

internal class GoogleDirectionsResponse
{
    public List<GoogleRoute>? Routes { get; set; }
}

internal class GoogleRoute
{
    public List<GoogleLeg>? Legs { get; set; }
    public Polyline? OverviewPolyline { get; set; }
}

internal class Polyline
{
    public string? Points { get; set; }
}

internal class GoogleLeg
{
    public List<GoogleStep>? Steps { get; set; }
    public DistanceValue? Distance { get; set; }
    public DistanceValue? Duration { get; set; }
}

internal class GoogleStep
{
    public string? HtmlInstructions { get; set; }
    public DistanceValue? Distance { get; set; }
    public DistanceValue? Duration { get; set; }
    public string? TravelMode { get; set; }
}

internal class GoogleGeocodingResponse
{
    public List<GeocodingResultItem>? Results { get; set; }
}

internal class GeocodingResultItem
{
    public string? FormattedAddress { get; set; }
    public Geometry? Geometry { get; set; }
}

internal class Geometry
{
    public Location? Location { get; set; }
}

internal class Location
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}
