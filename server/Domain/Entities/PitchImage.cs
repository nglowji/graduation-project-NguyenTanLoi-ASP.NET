using Domain.Common;
using Domain.Exceptions;

namespace Domain.Entities;

public class PitchImage : BaseEntity
{
    private const int MaxImageUrlLength = 1000;
    private const int MinDisplayOrder = 0;

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
        ValidateCreationParameters(pitchId, imageUrl);
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
        ValidateDisplayOrder(order);

        DisplayOrder = order;
        MarkAsUpdated();
    }

    public void UpdateUrl(string newUrl)
    {
        ValidateImageUrl(newUrl);

        ImageUrl = newUrl;
        MarkAsUpdated();
    }

    private static void ValidateCreationParameters(Guid pitchId, string imageUrl)
    {
        if (pitchId == Guid.Empty)
            throw new DomainException("Pitch ID is required");

        ValidateImageUrl(imageUrl);
    }

    private static void ValidateImageUrl(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            throw new DomainException("Image URL is required");

        if (imageUrl.Length > MaxImageUrlLength)
            throw new DomainException($"Image URL cannot exceed {MaxImageUrlLength} characters");
    }

    private static void ValidateDisplayOrder(int order)
    {
        if (order < MinDisplayOrder)
            throw new DomainException($"Display order cannot be less than {MinDisplayOrder}");
    }
}
