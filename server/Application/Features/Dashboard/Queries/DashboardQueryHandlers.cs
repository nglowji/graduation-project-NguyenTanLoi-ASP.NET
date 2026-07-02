using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Dashboard.DTOs;
using Domain.Entities;
using Domain.Enums;
using Application.Features.Pitches.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Dashboard.Queries;

/// <summary>Handler for Admin dashboard stats</summary>
public class GetAdminDashboardStatsQueryHandler : IRequestHandler<GetAdminDashboardStatsQuery, Result<AdminDashboardStatsDto>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IApplicationDbContext _context;

    public GetAdminDashboardStatsQueryHandler(
        IPitchRepository pitchRepository,
        IApplicationDbContext context)
    {
        _pitchRepository = pitchRepository;
        _context = context;
    }

    public async Task<Result<AdminDashboardStatsDto>> Handle(GetAdminDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thisMonthStart = new DateOnly(today.Year, today.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var lastMonthEnd = thisMonthStart.AddDays(-1);

        var thisMonthStartUtc = thisMonthStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var lastMonthStartUtc = lastMonthStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var totalUsers = await _context.Users.AsNoTracking().CountAsync(cancellationToken);
        var totalOwners = await _context.Users.AsNoTracking().CountAsync(u => u.Role == UserRole.PitchOwner, cancellationToken);
        var activeOwners = await _context.Users.AsNoTracking().CountAsync(u => u.Role == UserRole.PitchOwner && u.IsActive, cancellationToken);
        var thisMonthUsers = await _context.Users.AsNoTracking().CountAsync(u => u.CreatedAt >= thisMonthStartUtc, cancellationToken);
        var lastMonthUsers = await _context.Users.AsNoTracking().CountAsync(
            u => u.CreatedAt >= lastMonthStartUtc && u.CreatedAt < thisMonthStartUtc,
            cancellationToken);

        var confirmedStatuses = new[] { BookingStatus.Confirmed, BookingStatus.Completed };
        var thisMonthRevenueBase = await _context.Bookings.AsNoTracking()
            .Where(b => b.BookingDate >= thisMonthStart
                && b.BookingDate <= today
                && confirmedStatuses.Contains(b.Status))
            .SumAsync(b => b.TotalPrice.Amount, cancellationToken);
        var lastMonthRevenueBase = await _context.Bookings.AsNoTracking()
            .Where(b => b.BookingDate >= lastMonthStart
                && b.BookingDate <= lastMonthEnd
                && confirmedStatuses.Contains(b.Status))
            .SumAsync(b => b.TotalPrice.Amount, cancellationToken);

        var totalPitches = await _context.Pitches.AsNoTracking().CountAsync(cancellationToken);
        var totalBookings = await _context.Bookings.AsNoTracking().CountAsync(cancellationToken);
        var pendingPitches = await _pitchRepository.GetPagedAsync(1, 1, null, PitchStatus.PendingApproval, cancellationToken);
        var pendingOwnerCenters = await _context.SportCenters
            .AsNoTracking()
            .CountAsync(center => !center.IsActive && _context.Users.Any(user => user.Id == center.OwnerId && user.Role == UserRole.Customer), cancellationToken);

        var commissionRate = await DashboardConfigurationReader.GetPlatformCommissionRateAsync(
            _context,
            cancellationToken);
        var thisMonthRevenue = thisMonthRevenueBase * commissionRate;
        var lastMonthRevenue = lastMonthRevenueBase * commissionRate;

        var commissionGrowth = lastMonthRevenue > 0
            ? Math.Round((double)((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100), 1)
            : 0;

        var userGrowth = lastMonthUsers > 0
            ? Math.Round((double)(thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100, 1)
            : 0;

        return Result<AdminDashboardStatsDto>.Success(new AdminDashboardStatsDto(
            totalUsers,
            totalOwners,
            totalPitches,
            totalBookings,
            activeOwners,
            thisMonthRevenue,
            pendingPitches.TotalCount + pendingOwnerCenters,
            userGrowth,
            commissionGrowth
        ));
    }
}

/// <summary>Handler for Owner dashboard stats</summary>
public class GetOwnerDashboardStatsQueryHandler : IRequestHandler<GetOwnerDashboardStatsQuery, Result<OwnerDashboardStatsDto>>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IPitchRepository _pitchRepository;

    public GetOwnerDashboardStatsQueryHandler(IBookingRepository bookingRepository, IPitchRepository pitchRepository)
    {
        _bookingRepository = bookingRepository;
        _pitchRepository = pitchRepository;
    }

    public async Task<Result<OwnerDashboardStatsDto>> Handle(GetOwnerDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thisMonthStart = new DateOnly(today.Year, today.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var lastMonthEnd = thisMonthStart.AddDays(-1);

        var pitches = await _pitchRepository.GetByOwnerIdAsync(request.OwnerId, cancellationToken);
        if (!pitches.Any())
            return Result<OwnerDashboardStatsDto>.Success(new OwnerDashboardStatsDto(0, 0, 0, 0, 0, 0));

        var pitchIds = pitches.Select(p => p.Id).ToList();
        var thisMonthBookings = await _bookingRepository.GetByPitchesAndDateRangeAsync(pitchIds, thisMonthStart, today, cancellationToken);
        var lastMonthBookings = await _bookingRepository.GetByPitchesAndDateRangeAsync(pitchIds, lastMonthStart, lastMonthEnd, cancellationToken);

        var confirmedThis = thisMonthBookings.Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed).ToList();
        var confirmedLast = lastMonthBookings.Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed).ToList();

        var thisRevenue = confirmedThis.Sum(b => b.TotalPrice.Amount);
        var lastRevenue = confirmedLast.Sum(b => b.TotalPrice.Amount);

        var revenueChange = lastRevenue > 0
            ? Math.Round((double)((thisRevenue - lastRevenue) / lastRevenue * 100), 1) : 0;

        var bookingsChange = confirmedLast.Count > 0
            ? Math.Round((double)(confirmedThis.Count - confirmedLast.Count) / confirmedLast.Count * 100, 1) : 0;

        var uniqueCustomers = thisMonthBookings.Select(b => b.UserId).Distinct().Count();

        var totalReviews = pitches.Sum(p => p.TotalReviews);
        var averageRating = totalReviews > 0
            ? pitches.Sum(p => (double)p.AverageRating * p.TotalReviews) / totalReviews
            : 0;

        return Result<OwnerDashboardStatsDto>.Success(new OwnerDashboardStatsDto(
            thisRevenue,
            confirmedThis.Count,
            uniqueCustomers,
            Math.Round(averageRating, 1),
            revenueChange,
            bookingsChange
        ));
    }
}

/// <summary>Handler for owner bookings list</summary>
public class GetOwnerBookingsQueryHandler : IRequestHandler<GetOwnerBookingsQuery, Result<PagedResult<OwnerBookingDto>>>
{
    private readonly IBookingRepository _bookingRepository;

    public GetOwnerBookingsQueryHandler(IBookingRepository bookingRepository)
    {
        _bookingRepository = bookingRepository;
    }

    public async Task<Result<PagedResult<OwnerBookingDto>>> Handle(GetOwnerBookingsQuery request, CancellationToken cancellationToken)
    {
        var paged = await _bookingRepository.GetByOwnerIdPagedAsync(
            request.OwnerId, request.PageNumber, request.PageSize, request.Status, cancellationToken);

        var dtos = paged.Items.Select(b => new OwnerBookingDto(
            b.Id,
            b.User?.FullName ?? "Khách hàng",
            b.User?.PhoneNumber ?? "",
            b.TimeSlot?.Pitch?.Name ?? "N/A",
            b.TimeSlot?.Pitch?.Type.ToString() ?? "Unknown",
            b.BookingDate.ToString("dd/MM/yyyy"),
            b.TimeSlot?.TimeRange.StartTime.ToString(@"hh\:mm") ?? "",
            b.TimeSlot?.TimeRange.EndTime.ToString(@"hh\:mm") ?? "",
            b.TotalPrice.Amount,
            b.Status.ToString(),
            b.Services.Select(service => new OwnerBookingServiceDto(
                service.Id,
                service.ServiceId,
                service.ServiceName,
                service.Price.Amount,
                service.Quantity,
                service.Price.Amount * service.Quantity,
                service.AddedByName
            )).ToList()
        )).ToList();

        return Result<PagedResult<OwnerBookingDto>>.Success(
            new PagedResult<OwnerBookingDto>(dtos, paged.TotalCount, paged.PageNumber, paged.PageSize));
    }
}

/// <summary>Handler for owner pitches summary</summary>
public class GetOwnerPitchesQueryHandler : IRequestHandler<GetOwnerPitchesQuery, Result<List<OwnerPitchSummaryDto>>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IBookingRepository _bookingRepository;

    public GetOwnerPitchesQueryHandler(IPitchRepository pitchRepository, IBookingRepository bookingRepository)
    {
        _pitchRepository = pitchRepository;
        _bookingRepository = bookingRepository;
    }

    public async Task<Result<List<OwnerPitchSummaryDto>>> Handle(GetOwnerPitchesQuery request, CancellationToken cancellationToken)
    {
        var pitches = await _pitchRepository.GetByOwnerIdAsync(request.OwnerId, cancellationToken);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var pitchIds = pitches.Select(p => p.Id).ToList();
        var todayBookings = pitchIds.Count == 0
            ? []
            : await _bookingRepository.GetByPitchesAndDateRangeAsync(pitchIds, today, today, cancellationToken);

        var confirmedStatuses = new[] { BookingStatus.Confirmed, BookingStatus.Completed };
        var bookingsByPitch = todayBookings
            .Where(b => b.TimeSlot != null && confirmedStatuses.Contains(b.Status))
            .GroupBy(b => b.TimeSlot!.PitchId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var summaries = pitches.Select(pitch =>
        {
            bookingsByPitch.TryGetValue(pitch.Id, out var confirmed);
            confirmed ??= [];

            return new OwnerPitchSummaryDto(
                pitch.Id,
                pitch.Name,
                NormalizePitchType(pitch.Type).ToString(),
                GetPitchTypeDisplay(NormalizePitchType(pitch.Type)),
                pitch.Status.ToString(),
                confirmed.Count,
                confirmed.Sum(b => b.TotalPrice.Amount),
                (double)pitch.AverageRating,
                pitch.TotalReviews,
                pitch.SportCenter?.Address?.GetFullAddress() ?? "",
                pitch.MapLink,
                pitch.IsIndoor,
                pitch.Images
                    .OrderByDescending(img => img.IsPrimary)
                    .ThenBy(img => img.DisplayOrder)
                    .Select(img => new PitchImageDto
                    {
                        Id = img.Id,
                        ImageUrl = img.ImageUrl,
                        IsPrimary = img.IsPrimary,
                        DisplayOrder = img.DisplayOrder
                    })
                    .ToList(),
                pitch.TimeSlots.Where(ts => ts.IsActive).Select(ts => new TimeSlotDto { 
                    Id = ts.Id, 
                    StartTime = ts.TimeRange.StartTime, 
                    EndTime = ts.TimeRange.EndTime, 
                    Price = ts.Price.Amount,
                    IsActive = ts.IsActive
                }).ToList(),
                pitch.TimeSlots.Where(ts => ts.IsActive).Any() ? pitch.TimeSlots.Where(ts => ts.IsActive).Min(ts => ts.Price.Amount) : 0
            );
        }).ToList();

        return Result<List<OwnerPitchSummaryDto>>.Success(summaries);
    }

    private static PitchType NormalizePitchType(PitchType type)
    {
        return Enum.IsDefined(typeof(PitchType), type) ? type : PitchType.Football5;
    }

    private static string GetPitchTypeDisplay(PitchType type)
    {
        return type switch
        {
            PitchType.Football5 => "Football 5",
            PitchType.Football7 => "Football 7",
            PitchType.Football11 => "Football 11",
            PitchType.Tennis => "Tennis",
            PitchType.Badminton => "Badminton",
            PitchType.Pickleball => "Pickleball",
            PitchType.Basketball => "Basketball",
            PitchType.Volleyball => "Volleyball",
            PitchType.TableTennis => "Table tennis",
            _ => "Football 5"
        };
    }
}

/// <summary>Handler for admin revenue report and commission tracing</summary>
public class GetAdminRevenueReportQueryHandler : IRequestHandler<GetAdminRevenueReportQuery, Result<AdminRevenueReportDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAdminRevenueReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<AdminRevenueReportDto>> Handle(GetAdminRevenueReportQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var safeDays = Math.Clamp(request.Days, 1, 365);
        var toDate = request.ToDate ?? today;
        var fromDate = request.FromDate ?? toDate.AddDays(-(safeDays - 1));

        if (fromDate > toDate)
            return Result<AdminRevenueReportDto>.Failure("From date must be before to date.");

        var previousTo = fromDate.AddDays(-1);
        var previousFrom = previousTo.AddDays(-(toDate.DayNumber - fromDate.DayNumber));

        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
                    .ThenInclude(p => p.SportCenter)
            .Where(b => b.BookingDate >= fromDate
                && b.BookingDate <= toDate
                && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

        var previousCommissionBase = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.BookingDate >= previousFrom
                && b.BookingDate <= previousTo
                && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .SumAsync(b => b.TotalPrice.Amount, cancellationToken);

        var ownerIds = bookings
            .Select(b => b.TimeSlot.Pitch.OwnerId)
            .Distinct()
            .ToList();

        var owners = await _context.Users
            .AsNoTracking()
            .Where(u => ownerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var commissionRate = await DashboardConfigurationReader.GetPlatformCommissionRateAsync(
            _context,
            cancellationToken);
        var grossRevenue = bookings.Sum(b => b.TotalPrice.Amount);
        var platformCommission = grossRevenue * commissionRate;
        var previousCommission = previousCommissionBase * commissionRate;
        var commissionGrowth = previousCommission > 0
            ? Math.Round((double)((platformCommission - previousCommission) / previousCommission * 100), 1)
            : 0;

        var trend = bookings
            .GroupBy(b => b.BookingDate)
            .Select(g => new AdminRevenueTrendPointDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Sum(b => b.TotalPrice.Amount),
                g.Sum(b => b.TotalPrice.Amount) * commissionRate,
                g.Count()))
            .OrderBy(item => item.Date)
            .ToList();

        var ownerRows = bookings
            .GroupBy(b => b.TimeSlot.Pitch.OwnerId)
            .Select(g =>
            {
                owners.TryGetValue(g.Key, out var owner);
                var ownerGross = g.Sum(b => b.TotalPrice.Amount);
                return new AdminOwnerCommissionDto(
                    g.Key,
                    owner?.FullName ?? "Unknown owner",
                    owner?.Email ?? "",
                    ownerGross,
                    ownerGross * commissionRate,
                    g.Count(),
                    g.Select(b => b.UserId).Distinct().Count());
            })
            .OrderByDescending(item => item.Commission)
            .ToList();

        var pitchTypes = bookings
            .GroupBy(b => b.TimeSlot.Pitch.Type.ToString())
            .Select(g =>
            {
                var typeGross = g.Sum(b => b.TotalPrice.Amount);
                return new AdminPitchTypeCommissionDto(
                    g.Key,
                    typeGross,
                    typeGross * commissionRate,
                    g.Count());
            })
            .OrderByDescending(item => item.Commission)
            .ToList();

        var transactions = bookings
            .Take(100)
            .Select(b =>
            {
                owners.TryGetValue(b.TimeSlot.Pitch.OwnerId, out var owner);
                return new AdminCommissionTransactionDto(
                    b.Id,
                    b.BookingDate.ToString("yyyy-MM-dd"),
                    b.User?.FullName ?? "Khach hang",
                    b.User?.Email ?? "",
                    b.TimeSlot.Pitch.Name,
                    b.TimeSlot.Pitch.Type.ToString(),
                    b.TimeSlot.Pitch.SportCenter?.Name ?? "N/A",
                    owner?.FullName ?? "Unknown owner",
                    owner?.Email ?? "",
                    b.TotalPrice.Amount,
                    b.TotalPrice.Amount * commissionRate,
                    b.Status.ToString());
            })
            .ToList();

        return Result<AdminRevenueReportDto>.Success(new AdminRevenueReportDto(
            grossRevenue,
            platformCommission,
            grossRevenue - platformCommission,
            commissionRate,
            bookings.Count,
            bookings.Count(b => b.Status == BookingStatus.Completed),
            bookings.Count(b => b.Status == BookingStatus.Confirmed),
            bookings.Select(b => b.UserId).Distinct().Count(),
            ownerRows.Count,
            commissionGrowth,
            trend,
            ownerRows,
            pitchTypes,
            transactions
        ));
    }
}

internal static class DashboardConfigurationReader
{
    public static async Task<decimal> GetPlatformCommissionRateAsync(
        IApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        string? value;
        try
        {
            value = await context.SystemConfigurations
                .AsNoTracking()
                .Where(item => item.Key == SystemConfiguration.Keys.PlatformCommissionPercentage)
                .Select(item => item.Value)
                .FirstOrDefaultAsync(cancellationToken);
        }
        catch
        {
            return 0.10m;
        }

        if (!decimal.TryParse(value, out var percentage))
            percentage = 10m;

        percentage = Math.Clamp(percentage, 0m, 100m);
        return percentage / 100m;
    }
}

/// <summary>Handler for admin users list</summary>
public class GetAdminUsersQueryHandler : IRequestHandler<GetAdminUsersQuery, Result<PagedResult<AdminUserDto>>>
{
    private readonly IUserRepository _userRepository;

    public GetAdminUsersQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<PagedResult<AdminUserDto>>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var paged = await _userRepository.GetPagedWithFilterAsync(
            request.PageNumber, request.PageSize, request.Search, request.Role, cancellationToken);

        var dtos = paged.Items.Select(u => new AdminUserDto(
            u.Id,
            u.FullName,
            u.Email,
            (int)u.Role,
            u.CreatedAt.ToString("o"),
            u.IsActive
        )).ToList();

        return Result<PagedResult<AdminUserDto>>.Success(
            new PagedResult<AdminUserDto>(dtos, paged.TotalCount, paged.PageNumber, paged.PageSize));
    }
}

/// <summary>Handler for pitch approvals list</summary>
public class GetPitchApprovalsQueryHandler : IRequestHandler<GetPitchApprovalsQuery, Result<PagedResult<PitchApprovalDto>>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IApplicationDbContext _context;

    public GetPitchApprovalsQueryHandler(
        IPitchRepository pitchRepository,
        IApplicationDbContext context)
    {
        _pitchRepository = pitchRepository;
        _context = context;
    }

    public async Task<Result<PagedResult<PitchApprovalDto>>> Handle(GetPitchApprovalsQuery request, CancellationToken cancellationToken)
    {
        var normalizedStatus = NormalizeApprovalStatus(request.Status);
        Enum.TryParse<PitchStatus>(normalizedStatus, true, out var status);
        var paged = await _pitchRepository.GetPagedAsync(1, 50, null, status, cancellationToken);

        var ownerIds = paged.Items.Select(p => p.OwnerId).Distinct().ToList();
        var owners = await _context.Users
            .AsNoTracking()
            .Where(u => ownerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var dtos = paged.Items.Select(pitch =>
        {
            owners.TryGetValue(pitch.OwnerId, out var owner);
            return new PitchApprovalDto(
                pitch.Id,
                pitch.Name,
                owner?.FullName ?? "N/A",
                owner?.Email ?? "N/A",
                pitch.CreatedAt.ToString("o"),
                pitch.Type.ToString(),
                pitch.SportCenter?.Address?.GetFullAddress() ?? "N/A",
                pitch.Status == PitchStatus.PendingApproval ? "pending" : pitch.Status.ToString().ToLowerInvariant()
            );
        }).ToList();

        return Result<PagedResult<PitchApprovalDto>>.Success(
            new PagedResult<PitchApprovalDto>(dtos, dtos.Count, 1, 50));
    }

    private static string NormalizeApprovalStatus(string status)
    {
        var normalized = status.Trim().ToLowerInvariant();
        return normalized switch
        {
            "pending" => nameof(PitchStatus.PendingApproval),
            "approved" => nameof(PitchStatus.Active),
            "rejected" => nameof(PitchStatus.Inactive),
            _ => status
        };
    }
}

/// <summary>Handler for suspend user</summary>
public class SuspendUserCommandHandler : IRequestHandler<SuspendUserCommand, Result<bool>>
{
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;

    public SuspendUserCommandHandler(IUserRepository userRepository, IApplicationDbContext context)
    {
        _userRepository = userRepository;
        _context = context;
    }

    public async Task<Result<bool>> Handle(SuspendUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null) return Result<bool>.Failure("Không tìm thấy người dùng");

        if (user.Role == UserRole.Admin)
            return Result<bool>.Failure("Không thể đình chỉ tài khoản Admin");

        if (user.IsActive) user.Deactivate();
        else user.Activate();

        await _userRepository.UpdateAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}

/// <summary>Handler for approve pitch</summary>
public class ApprovePitchCommandHandler : IRequestHandler<ApprovePitchCommand, Result<bool>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IApplicationDbContext _context;
    private readonly IUserRepository _userRepository;

    public ApprovePitchCommandHandler(IPitchRepository pitchRepository, IApplicationDbContext context, IUserRepository userRepository)
    {
        _pitchRepository = pitchRepository;
        _context = context;
        _userRepository = userRepository;
    }

    public async Task<Result<bool>> Handle(ApprovePitchCommand request, CancellationToken cancellationToken)
    {
        var pitch = await _pitchRepository.GetByIdAsync(request.PitchId, cancellationToken);
        if (pitch == null)
        {
            var center = await _context.SportCenters.FirstOrDefaultAsync(item => item.Id == request.PitchId, cancellationToken);
            if (center == null) return Result<bool>.Failure("Không tìm thấy hồ sơ cần duyệt");

            var owner = await _userRepository.GetByIdAsync(center.OwnerId, cancellationToken);
            if (owner == null) return Result<bool>.Failure("Không tìm thấy tài khoản đăng ký");

            owner.PromoteToPitchOwner();
            center.Activate();
            _context.Notifications.Add(Notification.Create(
                owner.Id,
                NotificationType.PitchApproved,
                "Hồ sơ chủ sân đã được duyệt",
                "Hồ sơ đăng ký sân của bạn đã được phê duyệt. Bạn có thể vào trang quản lý sân ngay bây giờ."
            ));

            await _context.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }

        pitch.Approve();
        await _pitchRepository.UpdateAsync(pitch, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}

/// <summary>Handler for reject pitch</summary>
public class RejectPitchCommandHandler : IRequestHandler<RejectPitchCommand, Result<bool>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IApplicationDbContext _context;
    private readonly IUserRepository _userRepository;

    public RejectPitchCommandHandler(IPitchRepository pitchRepository, IApplicationDbContext context, IUserRepository userRepository)
    {
        _pitchRepository = pitchRepository;
        _context = context;
        _userRepository = userRepository;
    }

    public async Task<Result<bool>> Handle(RejectPitchCommand request, CancellationToken cancellationToken)
    {
        var pitch = await _pitchRepository.GetByIdAsync(request.PitchId, cancellationToken);
        if (pitch == null)
        {
            var center = await _context.SportCenters.FirstOrDefaultAsync(item => item.Id == request.PitchId, cancellationToken);
            if (center == null) return Result<bool>.Failure("Không tìm thấy hồ sơ cần duyệt");

            _context.Notifications.Add(Notification.Create(
                center.OwnerId,
                NotificationType.PitchRejected,
                "Hồ sơ chủ sân chưa được duyệt",
                "Hồ sơ đăng ký sân của bạn chưa được phê duyệt. Vui lòng kiểm tra lại thông tin và liên hệ hỗ trợ nếu cần."
            ));

            _context.SportCenters.Remove(center);
            await _context.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }

        pitch.Deactivate(); // Or a specific Rejection status if added later
        await _pitchRepository.UpdateAsync(pitch, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
