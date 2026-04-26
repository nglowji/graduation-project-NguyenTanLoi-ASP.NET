using Domain.Enums;

namespace Application.Features.Pitches.DTOs;

public class PitchDto
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public PitchType Type { get; set; }
    public string TypeDisplay { get; set; } = string.Empty;
    public AddressDto Address { get; set; } = null!;
    public string? Description { get; set; }
    public PitchStatus Status { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public List<PitchImageDto> Images { get; set; } = new();
    public List<string> Amenities { get; set; } = new();
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public double? DistanceKm { get; set; }
}

public class AddressDto
{
    public string Street { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string FullAddress { get; set; } = string.Empty;
}

public class PitchImageDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int DisplayOrder { get; set; }
}

public class PitchDetailDto : PitchDto
{
    public List<TimeSlotDto> TimeSlots { get; set; } = new();
    public List<ReviewDto> Reviews { get; set; } = new();
}

public class TimeSlotDto
{
    public Guid Id { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public bool IsActive { get; set; }
    public bool IsAvailable { get; set; }
}

public class ReviewDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
