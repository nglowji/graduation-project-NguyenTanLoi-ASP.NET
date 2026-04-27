using Domain.Common;

namespace Domain.Entities;

/// <summary>
/// Lưu trữ preferences và thói quen của user để AI gợi ý
/// </summary>
public class UserPreference : BaseEntity
{
    private UserPreference() { } // EF Core

    private UserPreference(Guid userId)
    {
        UserId = userId;
        PreferredPitchTypes = new List<int>();
        PreferredTimeSlots = new List<string>();
        PreferredLocations = new List<string>();
    }

    public Guid UserId { get; private set; }
    
    // Loại sân ưa thích (Football, Badminton, etc.)
    public List<int> PreferredPitchTypes { get; private set; } = new();
    
    // Khung giờ ưa thích (Morning, Afternoon, Evening)
    public List<string> PreferredTimeSlots { get; private set; } = new();
    
    // Địa điểm ưa thích (districts, cities)
    public List<string> PreferredLocations { get; private set; } = new();
    
    // Ngân sách trung bình
    public decimal? AverageBudget { get; private set; }
    
    // Tần suất đặt sân (bookings per month)
    public int BookingFrequency { get; private set; }
    
    // Thời gian đặt trước trung bình (hours)
    public int AverageAdvanceBookingHours { get; private set; }
    
    // Home location (latitude, longitude) để tính khoảng cách
    public double? HomeLatitude { get; private set; }
    public double? HomeLongitude { get; private set; }
    
    // Work location
    public double? WorkLatitude { get; private set; }
    public double? WorkLongitude { get; private set; }

    public static UserPreference Create(Guid userId)
    {
        return new UserPreference(userId);
    }

    public void UpdatePreferredPitchTypes(List<int> pitchTypes)
    {
        PreferredPitchTypes = pitchTypes ?? new List<int>();
        MarkAsUpdated();
    }

    public void UpdatePreferredTimeSlots(List<string> timeSlots)
    {
        PreferredTimeSlots = timeSlots ?? new List<string>();
        MarkAsUpdated();
    }

    public void UpdatePreferredLocations(List<string> locations)
    {
        PreferredLocations = locations ?? new List<string>();
        MarkAsUpdated();
    }

    public void UpdateBudget(decimal budget)
    {
        AverageBudget = budget;
        MarkAsUpdated();
    }

    public void UpdateBookingStats(int frequency, int averageAdvanceHours)
    {
        BookingFrequency = frequency;
        AverageAdvanceBookingHours = averageAdvanceHours;
        MarkAsUpdated();
    }

    public void UpdateHomeLocation(double latitude, double longitude)
    {
        HomeLatitude = latitude;
        HomeLongitude = longitude;
        MarkAsUpdated();
    }

    public void UpdateWorkLocation(double latitude, double longitude)
    {
        WorkLatitude = latitude;
        WorkLongitude = longitude;
        MarkAsUpdated();
    }
}
