using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class Pitch : BaseEntity, IAggregateRoot
{
    private const int MaxNameLength = 200;
    private const decimal MinRating = 0m;
    private const decimal MaxRating = 5m;
    
    private readonly List<TimeSlot> _timeSlots = new();
    private readonly List<PitchImage> _images = new();

    private Pitch() { } // EF Core constructor

    private Pitch(Guid ownerId, string name, PitchType type, Address address, string? description)
    {
        OwnerId = ownerId;
        Name = name;
        Type = type;
        Address = address;
        Description = description;
        Status = PitchStatus.PendingApproval;
        AverageRating = 0;
        TotalReviews = 0;
    }

    public Guid OwnerId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public PitchType Type { get; private set; }
    public Address Address { get; private set; } = null!;
    public string? Description { get; private set; }
    public PitchStatus Status { get; private set; }
    public decimal AverageRating { get; private set; }
    public int TotalReviews { get; private set; }

    public IReadOnlyCollection<TimeSlot> TimeSlots => _timeSlots.AsReadOnly();
    public IReadOnlyCollection<PitchImage> Images => _images.AsReadOnly();

    public static Pitch Create(Guid ownerId, string name, PitchType type, Address address, string? description = null)
    {
        ValidateCreationParameters(ownerId, name);
        return new Pitch(ownerId, name, type, address, description);
    }

    public void UpdateInfo(string name, PitchType type, Address address, string? description)
    {
        ValidateName(name);
        
        Name = name;
        Type = type;
        Address = address;
        Description = description;
        MarkAsUpdated();
    }

    public void Approve()
    {
        EnsureStatusIs(PitchStatus.PendingApproval, "Only pending pitches can be approved");
        TransitionToStatus(PitchStatus.Active);
    }

    public void Activate()
    {
        EnsureStatusIsNot(PitchStatus.Active, "Pitch is already active");
        TransitionToStatus(PitchStatus.Active);
    }

    public void Deactivate()
    {
        EnsureStatusIsNot(PitchStatus.Inactive, "Pitch is already inactive");
        TransitionToStatus(PitchStatus.Inactive);
    }

    public void MarkUnderMaintenance() => TransitionToStatus(PitchStatus.UnderMaintenance);

    public void AddTimeSlot(TimeRange timeRange, Money price)
    {
        EnsureNoTimeSlotOverlap(timeRange);
        
        var timeSlot = TimeSlot.Create(Id, timeRange, price);
        _timeSlots.Add(timeSlot);
        MarkAsUpdated();
    }

    public void AddImage(string imageUrl, bool isPrimary = false)
    {
        ValidateImageUrl(imageUrl);
        
        if (isPrimary)
            SetAllImagesAsSecondary();

        var image = PitchImage.Create(Id, imageUrl, isPrimary);
        _images.Add(image);
        MarkAsUpdated();
    }

    public void UpdateRating(decimal newRating)
    {
        ValidateRating(newRating);
        RecalculateAverageRating(newRating);
        MarkAsUpdated();
    }

    public bool IsOwnedBy(Guid userId) => OwnerId == userId;
    public bool IsActive() => Status == PitchStatus.Active;
    public bool IsAvailableForBooking() => IsActive() && HasActiveTimeSlots();

    private static void ValidateCreationParameters(Guid ownerId, string name)
    {
        if (ownerId == Guid.Empty)
            throw new DomainException("Owner ID is required");

        ValidateName(name);
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Pitch name is required");

        if (name.Length > MaxNameLength)
            throw new DomainException($"Pitch name cannot exceed {MaxNameLength} characters");
    }

    private void EnsureStatusIs(PitchStatus expectedStatus, string errorMessage)
    {
        if (Status != expectedStatus)
            throw new DomainException(errorMessage);
    }

    private void EnsureStatusIsNot(PitchStatus unexpectedStatus, string errorMessage)
    {
        if (Status == unexpectedStatus)
            throw new DomainException(errorMessage);
    }

    private void TransitionToStatus(PitchStatus newStatus)
    {
        Status = newStatus;
        MarkAsUpdated();
    }

    private void EnsureNoTimeSlotOverlap(TimeRange timeRange)
    {
        var hasOverlap = _timeSlots.Any(ts => ts.IsActive && ts.TimeRange.OverlapsWith(timeRange));
        if (hasOverlap)
            throw new DomainException("Time slot overlaps with existing active time slot");
    }

    private static void ValidateImageUrl(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            throw new DomainException("Image URL is required");
    }

    private void SetAllImagesAsSecondary()
    {
        foreach (var image in _images)
            image.SetAsSecondary();
    }

    private static void ValidateRating(decimal rating)
    {
        if (rating < MinRating || rating > MaxRating)
            throw new DomainException($"Rating must be between {MinRating} and {MaxRating}");
    }

    private void RecalculateAverageRating(decimal newRating)
    {
        var totalRatingPoints = AverageRating * TotalReviews + newRating;
        TotalReviews++;
        AverageRating = totalRatingPoints / TotalReviews;
    }

    private bool HasActiveTimeSlots() => _timeSlots.Any(ts => ts.IsActive);
}
