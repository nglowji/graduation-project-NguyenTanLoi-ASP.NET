using Domain.Common;

namespace Domain.Entities;

public class PitchAmenity : BaseEntity
{
    private PitchAmenity() { } // EF Core constructor

    private PitchAmenity(Guid pitchId, Guid amenityId)
    {
        PitchId = pitchId;
        AmenityId = amenityId;
    }

    public Guid PitchId { get; private set; }
    public Guid AmenityId { get; private set; }

    public Pitch Pitch { get; private set; } = null!;
    public Amenity Amenity { get; private set; } = null!;

    public static PitchAmenity Create(Guid pitchId, Guid amenityId)
    {
        return new PitchAmenity(pitchId, amenityId);
    }
}
