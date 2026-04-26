namespace Domain.ValueObjects;

public record Address
{
    public string Street { get; init; }
    public string Ward { get; init; }
    public string District { get; init; }
    public string City { get; init; }
    public double Latitude { get; init; }
    public double Longitude { get; init; }

    private Address(string street, string ward, string district, string city, double latitude, double longitude)
    {
        Street = street;
        Ward = ward;
        District = district;
        City = city;
        Latitude = latitude;
        Longitude = longitude;
    }

    public static Address Create(string street, string ward, string district, string city, double latitude, double longitude)
    {
        if (string.IsNullOrWhiteSpace(street))
            throw new ArgumentException("Street is required", nameof(street));

        if (string.IsNullOrWhiteSpace(city))
            throw new ArgumentException("City is required", nameof(city));

        if (latitude < -90 || latitude > 90)
            throw new ArgumentException("Latitude must be between -90 and 90", nameof(latitude));

        if (longitude < -180 || longitude > 180)
            throw new ArgumentException("Longitude must be between -180 and 180", nameof(longitude));

        return new Address(street, ward, district, city, latitude, longitude);
    }

    public string GetFullAddress() => $"{Street}, {Ward}, {District}, {City}";

    public double CalculateDistanceTo(Address other)
    {
        // Haversine formula để tính khoảng cách giữa 2 điểm (km)
        const double earthRadius = 6371;

        var lat1Rad = Latitude * Math.PI / 180;
        var lat2Rad = other.Latitude * Math.PI / 180;
        var deltaLat = (other.Latitude - Latitude) * Math.PI / 180;
        var deltaLon = (other.Longitude - Longitude) * Math.PI / 180;

        var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadius * c;
    }
}
