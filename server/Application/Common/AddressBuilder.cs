using Domain.ValueObjects;

namespace Application.Common;

public static class AddressBuilder
{
    public static Address FromFullAddress(
        string fullAddress,
        Address currentAddress,
        double? latitude,
        double? longitude,
        double? fallbackLatitude = null,
        double? fallbackLongitude = null)
    {
        var parts = fullAddress
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        var city = currentAddress.City;
        var district = currentAddress.District;
        var ward = currentAddress.Ward;

        switch (parts.Count)
        {
            case >= 4:
                city = parts[^1];
                district = parts[^2];
                ward = parts[^3];
                break;
            case 3:
                city = parts[^1];
                district = parts[^2];
                ward = string.Empty;
                break;
            case 2:
                city = parts[^1];
                district = string.Empty;
                ward = string.Empty;
                break;
            case 1:
                city = parts[0];
                district = string.Empty;
                ward = string.Empty;
                break;
        }

        var resolvedLatitude = latitude ?? currentAddress.Latitude;
        var resolvedLongitude = longitude ?? currentAddress.Longitude;

        if (resolvedLatitude == 0 && resolvedLongitude == 0 &&
            fallbackLatitude.HasValue && fallbackLongitude.HasValue)
        {
            resolvedLatitude = fallbackLatitude.Value;
            resolvedLongitude = fallbackLongitude.Value;
        }

        return Address.Create(
            fullAddress,
            ward,
            district,
            city,
            resolvedLatitude,
            resolvedLongitude);
    }
}
