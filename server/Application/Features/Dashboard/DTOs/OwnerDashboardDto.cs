namespace Application.Features.Dashboard.DTOs;

public class OwnerDashboardDto
{
    public SummaryStatsDto Summary { get; set; } = new();
    public List<RevenueStatDto> RevenueChart { get; set; } = new();
    public List<BookingStatusStatDto> BookingStatusDistribution { get; set; } = new();
    public List<RecentBookingDto> RecentBookings { get; set; } = new();
}

public class SummaryStatsDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalBookings { get; set; }
    public int ActivePitches { get; set; }
    public double OccupancyRate { get; set; }
}

public class RevenueStatDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class BookingStatusStatDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class RecentBookingDto
{
    public Guid Id { get; set; }
    public string PitchName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string BookingDate { get; set; } = string.Empty;
    public string TimeRange { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
}
