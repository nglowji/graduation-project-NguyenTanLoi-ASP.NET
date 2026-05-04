using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Features.Dashboard.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Dashboard.Queries;

public class GetOwnerDashboardQueryHandler : IRequestHandler<GetOwnerDashboardQuery, Result<OwnerDashboardDto>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;

    public GetOwnerDashboardQueryHandler(
        IPitchRepository pitchRepository,
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository)
    {
        _pitchRepository = pitchRepository;
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
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
        var endDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var startDate = endDate.AddDays(-request.Days);

        // 3. Get bookings for these pitches
        var bookings = await _bookingRepository.GetByPitchesAndDateRangeAsync(pitchIds, startDate, endDate, cancellationToken);

        // 4. Get active timeslots to calculate occupancy more accurately
        var allTimeSlots = pitches.SelectMany(p => p.TimeSlots).ToList();
        if (!allTimeSlots.Any())
        {
            // Fetch if not loaded
            var slotsList = new List<Domain.Entities.TimeSlot>();
            foreach (var pid in pitchIds)
            {
                var slots = await _timeSlotRepository.GetByPitchIdAsync(pid, cancellationToken);
                slotsList.AddRange(slots.Where(ts => ts.IsActive));
            }
            allTimeSlots = slotsList;
        }

        // 5. Calculate stats
        var dashboard = new OwnerDashboardDto
        {
            Summary = CalculateSummary(pitches, bookings, allTimeSlots, request.Days),
            RevenueChart = CalculateRevenueChart(bookings, startDate, endDate),
            BookingStatusDistribution = CalculateStatusDistribution(bookings),
            RecentBookings = MapRecentBookings(bookings.Take(10).ToList())
        };

        return Result<OwnerDashboardDto>.Success(dashboard);
    }

    private SummaryStatsDto CalculateSummary(
        IReadOnlyList<Domain.Entities.Pitch> pitches, 
        IReadOnlyList<Domain.Entities.Booking> bookings,
        IReadOnlyList<Domain.Entities.TimeSlot> timeSlots,
        int days)
    {
        var confirmedBookings = bookings.Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed).ToList();
        
        // Revenue = Sum of TotalPrice of confirmed/completed bookings
        var totalRevenue = confirmedBookings.Sum(b => b.TotalPrice.Amount);

        // Calculate Occupancy Rate
        // Total slots available = (active slots per pitch) * (days)
        var activeSlotsCount = timeSlots.Count(ts => ts.IsActive);
        var totalPossibleSlots = activeSlotsCount * days;
        
        var occupancyRate = totalPossibleSlots > 0 
            ? (double)confirmedBookings.Count / totalPossibleSlots * 100 
            : 0;

        return new SummaryStatsDto
        {
            TotalRevenue = totalRevenue,
            TotalBookings = bookings.Count,
            ActivePitches = pitches.Count(p => p.Status == PitchStatus.Active),
            OccupancyRate = Math.Round(occupancyRate, 2)
        };
    }

    private List<RevenueStatDto> CalculateRevenueChart(IReadOnlyList<Domain.Entities.Booking> bookings, DateOnly start, DateOnly end)
    {
        var confirmedBookings = bookings.Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed);
        
        return confirmedBookings
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
            UserName = b.User?.FullName ?? "Khách hàng",
            BookingDate = b.BookingDate.ToString("yyyy-MM-dd"),
            TimeRange = b.TimeSlot?.TimeRange.ToString() ?? "N/A",
            TotalPrice = b.TotalPrice.Amount,
            Status = b.Status.ToString()
        }).ToList();
    }
}
