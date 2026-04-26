using Domain.Common;
using Domain.Exceptions;

namespace Domain.Entities;

public class PitchImage : BaseEntity
{
    private PitchImage() { } // EF Core constructor

    private PitchImage(Guid pitchId, string imageUrl, bool isPrimary)
    {
        PitchId = pitchId;
        ImageUrl = imageUrl;
        IsPrimary = isPrimary;
        DisplayOrder = 0;
    }

    public Guid PitchId { get; private set; }
    public string ImageUrl { get; private set; } = string.Empty;
    public bool IsPrimary { get; private set; }
    public int DisplayOrder { get; private set; }

    public Pitch Pitch { get; private set; } = null!;

    public static PitchImage Create(Guid pitchId, string imageUrl, bool isPrimary = false)
    {
        if (pitchId == Guid.Empty)
            throw new DomainException("Pitch ID is required");

        if (string.IsNullOrWhiteSpace(imageUrl))
            throw new DomainException("Image URL is required");

        return new PitchImage(pitchId, imageUrl, isPrimary);
    }

    public void SetAsPrimary()
    {
        if (IsPrimary)
            throw new DomainException("Image is already primary");

        IsPrimary = true;
        MarkAsUpdated();
    }

    public void SetAsSecondary()
    {
        if (!IsPrimary)
            return;

        IsPrimary = false;
        MarkAsUpdated();
    }

    public void UpdateDisplayOrder(int order)
    {
        if (order < 0)
            throw new DomainException("Display order cannot be negative");

        DisplayOrder = order;
        MarkAsUpdated();
    }

    public void UpdateUrl(string newUrl)
    {
        if (string.IsNullOrWhiteSpace(newUrl))
            throw new DomainException("Image URL is required");

        ImageUrl = newUrl;
        MarkAsUpdated();
    }
}
