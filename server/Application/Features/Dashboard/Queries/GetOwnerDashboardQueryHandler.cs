using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Dashboard.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Dashboard.Queries;

public class GetOwnerDashboardQueryHandler : IRequestHandler<GetOwnerDashboardQuery, Result<OwnerDashboardDto>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IBookingRepository _bookingRepository;

    public GetOwnerDashboardQueryHandler(
        IPitchRepository pitchRepository,
        IBookingRepository bookingRepository)
    {
        _pitchRepository = pitchRepository;
        _bookingRepository = bookingRepository;
    }

    public async Task<Result<OwnerDashboardDto>> Handle(GetOwnerDashboardQuery request, CancellationToken cancellationToken)
    {
        // 1. Get all pitches owned by this owner
        var pitches = await _pitchRepository.GetByOwnerIdAsync(request.OwnerId, cancellationToken);
        if (!pitches.Any())
        {
            return Result<OwnerDashboardDto>.Success(new OwnerDashboardDto());
        }

        var pitchIds = pitches.Select(p => p.Id).ToList();

        // 2. Define date range
        var endDate = request.ToDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var startDate = request.FromDate ?? endDate.AddDays(-request.Days);

        if (startDate > endDate)
            return Result<OwnerDashboardDto>.Failure("From date must be before or equal to to date");

        // 3. Get bookings for these pitches in date range
        var bookings = await _bookingRepository.GetByPitchesAndDateRangeAsync(pitchIds, startDate, endDate, cancellationToken);
        var rangeDays = Math.Max(endDate.DayNumber - startDate.DayNumber + 1, 1);

        // 4. Time slots are already loaded with pitches
        var allTimeSlots = pitches.SelectMany(p => p.TimeSlots).Where(ts => ts.IsActive).ToList();

        // 5. Calculate stats
        var dashboard = new OwnerDashboardDto
        {
            Summary = CalculateSummary(pitches, bookings, allTimeSlots, rangeDays),
            RevenueChart = CalculateRevenueChart(bookings, startDate, endDate),
            BookingStatusDistribution = CalculateStatusDistribution(bookings),
            PitchRevenue = CalculatePitchRevenue(bookings),
            TopCustomers = CalculateTopCustomers(bookings),
            TopServices = CalculateTopServices(bookings),
            RecentBookings = MapRecentBookings(bookings
                .OrderByDescending(b => b.BookingDate)
                .ThenByDescending(b => b.CreatedAt)
                .Take(10)
                .ToList())
        };

        return Result<OwnerDashboardDto>.Success(dashboard);
    }

    private List<TopCustomerDto> CalculateTopCustomers(IReadOnlyList<Domain.Entities.Booking> bookings)
    {
        return bookings
            .Where(b => b.Status == BookingStatus.Completed)
            .GroupBy(b => new { b.UserId, UserName = b.User != null ? b.User.FullName : "Khách hàng" })
            .Select(group => new TopCustomerDto
            {
                UserId = group.Key.UserId,
                UserName = group.Key.UserName,
                Bookings = group.Count(),
                TotalSpent = group.Sum(b => b.TotalPrice.Amount),
                FavoritePitchType = group
                    .Where(b => b.TimeSlot?.Pitch != null)
                    .GroupBy(b => b.TimeSlot!.Pitch!.Type)
                    .OrderByDescending(typeGroup => typeGroup.Count())
                    .Select(typeGroup => typeGroup.Key.ToString())
                    .FirstOrDefault() ?? "Unknown"
            })
            .OrderByDescending(customer => customer.Bookings)
            .ThenByDescending(customer => customer.TotalSpent)
            .ToList();
    }

    private List<TopServiceDto> CalculateTopServices(IReadOnlyList<Domain.Entities.Booking> bookings)
    {
        return bookings
            .Where(b => b.Status == BookingStatus.Completed)
            .SelectMany(b => b.Services)
            .GroupBy(service => new { service.ServiceId, service.ServiceName })
            .Select(group => new TopServiceDto
            {
                ServiceId = group.Key.ServiceId,
                ServiceName = group.Key.ServiceName,
                QuantitySold = group.Sum(service => service.Quantity),
                Revenue = group.Sum(service => service.Price.Amount * service.Quantity)
            })
            .OrderByDescending(service => service.QuantitySold)
            .ThenByDescending(service => service.Revenue)
            .ToList();
    }

    private List<PitchRevenueDto> CalculatePitchRevenue(IReadOnlyList<Domain.Entities.Booking> bookings)
    {
        return bookings
            .Where(b => b.Status == BookingStatus.Completed && b.TimeSlot?.Pitch != null)
            .GroupBy(b => new { b.TimeSlot.Pitch.Id, b.TimeSlot.Pitch.Name, b.TimeSlot.Pitch.Type })
            .Select(group => new PitchRevenueDto
            {
                PitchId = group.Key.Id,
                PitchName = group.Key.Name,
                PitchType = group.Key.Type.ToString(),
                Revenue = group.Sum(b => b.TotalPrice.Amount),
                Bookings = group.Count()
            })
            .OrderByDescending(item => item.Revenue)
            .ToList();
    }

    private SummaryStatsDto CalculateSummary(
        IReadOnlyList<Domain.Entities.Pitch> pitches, 
        IReadOnlyList<Domain.Entities.Booking> filteredBookings,
        IReadOnlyList<Domain.Entities.TimeSlot> timeSlots,
        int days)
    {
        var completedBookings = filteredBookings.Where(b => b.Status == BookingStatus.Completed).ToList();
        var occupiedBookings = filteredBookings.Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed).ToList();
        
        var totalRevenue = completedBookings.Sum(b => b.TotalPrice.Amount);
        var serviceRevenue = completedBookings.SelectMany(b => b.Services).Sum(service => service.Price.Amount * service.Quantity);
        var servicesSold = completedBookings.SelectMany(b => b.Services).Sum(service => service.Quantity);

        // Calculate Occupancy Rate
        // Total slots available = (active slots per pitch) * (days)
        var activeSlotsCount = timeSlots.Count(ts => ts.IsActive);
        var totalPossibleSlots = activeSlotsCount * days;
        
        var occupancyRate = totalPossibleSlots > 0 
            ? (double)occupiedBookings.Count / totalPossibleSlots * 100
            : 0;

        return new SummaryStatsDto
        {
            TotalRevenue = totalRevenue,
            ServiceRevenue = serviceRevenue,
            ServicesSold = servicesSold,
            TotalBookings = filteredBookings.Count,
            ActivePitches = pitches.Count(p => p.Status == PitchStatus.Active),
            OccupancyRate = Math.Round(occupancyRate, 2)
        };
    }

    private List<RevenueStatDto> CalculateRevenueChart(IReadOnlyList<Domain.Entities.Booking> bookings, DateOnly start, DateOnly end)
    {
        var completedBookings = bookings.Where(b => b.Status == BookingStatus.Completed);
        
        return completedBookings
            .GroupBy(b => b.BookingDate)
            .Select(g => new RevenueStatDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Amount = g.Sum(b => b.TotalPrice.Amount)
            })
            .OrderBy(r => r.Date)
            .ToList();
    }

    private List<BookingStatusStatDto> CalculateStatusDistribution(IReadOnlyList<Domain.Entities.Booking> bookings)
    {
        return bookings
            .GroupBy(b => b.Status)
            .Select(g => new BookingStatusStatDto
            {
                Status = g.Key.ToString(),
                Count = g.Count()
            })
            .ToList();
    }

    private List<RecentBookingDto> MapRecentBookings(List<Domain.Entities.Booking> bookings)
    {
        return bookings.Select(b => new RecentBookingDto
        {
            Id = b.Id,
            PitchName = b.TimeSlot?.Pitch?.Name ?? "N/A",
            PitchType = b.TimeSlot?.Pitch?.Type.ToString() ?? "Unknown",
            UserName = b.User?.FullName ?? "Khách hàng",
            BookingDate = b.BookingDate.ToString("yyyy-MM-dd"),
            TimeRange = b.TimeSlot?.TimeRange.ToString() ?? "N/A",
            TotalPrice = b.TotalPrice.Amount,
            Status = b.Status.ToString()
        }).ToList();
    }
}
