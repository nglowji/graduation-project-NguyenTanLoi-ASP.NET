namespace Application.Common.Interfaces;

/// <summary>
/// Service để tương tác với Google Maps API
/// </summary>
public interface IMapService
{
    /// <summary>
    /// Tính khoảng cách giữa 2 điểm
    /// </summary>
    Task<double> CalculateDistanceAsync(
        double fromLat, double fromLng,
        double toLat, double toLng);

    /// <summary>
    /// Lấy directions từ điểm A đến điểm B
    /// </summary>
    Task<DirectionsResponse> GetDirectionsAsync(
        double fromLat, double fromLng,
        double toLat, double toLng,
        string travelMode = "driving");

    /// <summary>
    /// Tìm các sân gần vị trí hiện tại
    /// </summary>
    Task<List<NearbyPitch>> FindNearbyPitchesAsync(
        double latitude, double longitude,
        double radiusKm = 5.0);

    /// <summary>
    /// Geocode địa chỉ thành tọa độ
    /// </summary>
    Task<GeocodingResult> GeocodeAddressAsync(string address);

    /// <summary>
    /// Reverse geocode tọa độ thành địa chỉ
    /// </summary>
    Task<string> ReverseGeocodeAsync(double latitude, double longitude);
}

public class DirectionsResponse
{
    public double DistanceMeters { get; set; }
    public int DurationSeconds { get; set; }
    public string DurationText { get; set; } = null!;
    public string DistanceText { get; set; } = null!;
    public List<DirectionStep> Steps { get; set; } = new();
    public string PolylineEncoded { get; set; } = null!; // For map rendering
}

public class DirectionStep
{
    public string Instruction { get; set; } = null!;
    public double DistanceMeters { get; set; }
    public int DurationSeconds { get; set; }
    public string TravelMode { get; set; } = null!;
}

public class NearbyPitch
{
    public Guid PitchId { get; set; }
    public string Name { get; set; } = null!;
    public double DistanceKm { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class GeocodingResult
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string FormattedAddress { get; set; } = null!;
}
