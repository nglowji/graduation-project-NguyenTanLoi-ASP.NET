using Application.Features.Pitches.DTOs;

namespace Application.Features.Dashboard.DTOs;

public record AdminDashboardStatsDto(
    int TotalUsers,
    int TotalOwners,
    int TotalPitches,
    int TotalBookings,
    int ActiveOwners,
    decimal PlatformCommission,
    int PendingApprovals,
    double UserGrowth,
    double CommissionGrowth
);

public record AdminRevenueReportDto(
    decimal GrossRevenue,
    decimal PlatformCommission,
    decimal OwnerRevenue,
    decimal CommissionRate,
    int TotalBookings,
    int CompletedBookings,
    int ConfirmedBookings,
    int UniqueCustomers,
    int ActiveOwners,
    double CommissionGrowth,
    IReadOnlyList<AdminRevenueTrendPointDto> Trend,
    IReadOnlyList<AdminOwnerCommissionDto> Owners,
    IReadOnlyList<AdminPitchTypeCommissionDto> PitchTypes,
    IReadOnlyList<AdminCommissionTransactionDto> Transactions
);

public record AdminRevenueTrendPointDto(
    string Date,
    decimal GrossRevenue,
    decimal Commission,
    int Bookings
);

public record AdminOwnerCommissionDto(
    Guid OwnerId,
    string OwnerName,
    string OwnerEmail,
    decimal GrossRevenue,
    decimal Commission,
    int Bookings,
    int UniqueCustomers
);

public record AdminPitchTypeCommissionDto(
    string PitchType,
    decimal GrossRevenue,
    decimal Commission,
    int Bookings
);

public record AdminCommissionTransactionDto(
    Guid BookingId,
    string BookingDate,
    string CustomerName,
    string CustomerEmail,
    string PitchName,
    string PitchType,
    string SportCenterName,
    string OwnerName,
    string OwnerEmail,
    decimal GrossAmount,
    decimal Commission,
    string Status
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
    string PitchType,
    string BookingDate,
    string StartTime,
    string EndTime,
    decimal TotalAmount,
    string Status,
    List<OwnerBookingServiceDto> Services
);

public record OwnerBookingServiceDto(
    Guid Id,
    Guid ServiceId,
    string ServiceName,
    decimal Price,
    int Quantity,
    decimal LineTotal
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
    string? MapLink,
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
