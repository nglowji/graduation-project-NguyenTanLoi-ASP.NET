using Domain.Common;
using Domain.Exceptions;

namespace Domain.Entities;

public class Amenity : BaseEntity
{
    private const int MaxNameLength = 100;
    private const int MaxIconLength = 50;

    private readonly List<PitchAmenity> _pitchAmenities = new();

    private Amenity() { } // EF Core constructor

    private Amenity(string name, string icon)
    {
        Name = name;
        Icon = icon;
    }

    public string Name { get; private set; } = string.Empty;
    public string Icon { get; private set; } = string.Empty;

    public IReadOnlyCollection<PitchAmenity> PitchAmenities => _pitchAmenities.AsReadOnly();

    public static Amenity Create(string name, string icon)
    {
        ValidateCreationParameters(name, icon);
        return new Amenity(name, icon);
    }

    public void Update(string name, string icon)
    {
        ValidateName(name);
        ValidateIcon(icon);

        Name = name;
        Icon = icon;
        MarkAsUpdated();
    }

    private static void ValidateCreationParameters(string name, string icon)
    {
        ValidateName(name);
        ValidateIcon(icon);
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Amenity name is required");

        if (name.Length > MaxNameLength)
            throw new DomainException($"Amenity name cannot exceed {MaxNameLength} characters");
    }

    private static void ValidateIcon(string icon)
    {
        if (string.IsNullOrWhiteSpace(icon))
            throw new DomainException("Icon is required");

        if (icon.Length > MaxIconLength)
            throw new DomainException($"Icon cannot exceed {MaxIconLength} characters");
    }
}
