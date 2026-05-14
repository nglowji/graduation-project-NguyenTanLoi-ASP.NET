using Application.Features.Pitches.DTOs;

namespace Application.Features.Dashboard.DTOs;

public record AdminDashboardStatsDto(
    int TotalUsers,
    int ActiveOwners,
    decimal PlatformCommission,
    int PendingApprovals,
    double UserGrowth,
    double CommissionGrowth
);

public record OwnerDashboardStatsDto(
    decimal TotalRevenue,
    int TotalBookings,
    int NewCustomers,
    double AverageRating,
    double RevenueChange,
    double BookingsChange
);

public record AdminUserDto(
    Guid Id,
    string FullName,
    string Email,
    int Role,
    string CreatedAt,
    bool IsActive
);

public record OwnerBookingDto(
    Guid Id,
    string CustomerName,
    string CustomerPhone,
    string PitchName,
    string BookingDate,
    string StartTime,
    string EndTime,
    decimal TotalAmount,
    string Status
);

public record OwnerPitchSummaryDto(
    Guid Id,
    string Name,
    string PitchType,
    string TypeDisplay,
    string Status,
    int TodayBookings,
    decimal TodayRevenue,
    double AverageRating,
    string Address,
    bool IsIndoor,
    List<PitchImageDto> Images,
    List<TimeSlotDto> TimeSlots,
    decimal MinPrice
);

public record PitchApprovalDto(
    Guid Id,
    string PitchName,
    string OwnerName,
    string OwnerEmail,
    string SubmittedAt,
    string PitchType,
    string Address,
    string Status
);
