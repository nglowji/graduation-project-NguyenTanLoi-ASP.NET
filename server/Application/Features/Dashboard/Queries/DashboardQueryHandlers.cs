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
    private readonly IUserRepository _userRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IPitchRepository _pitchRepository;
    private readonly IApplicationDbContext _context;

    public GetAdminDashboardStatsQueryHandler(
        IUserRepository userRepository,
        IBookingRepository bookingRepository,
        IPitchRepository pitchRepository,
        IApplicationDbContext context)
    {
        _userRepository = userRepository;
        _bookingRepository = bookingRepository;
        _pitchRepository = pitchRepository;
        _context = context;
    }

    public async Task<Result<AdminDashboardStatsDto>> Handle(GetAdminDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thisMonthStart = new DateOnly(today.Year, today.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var lastMonthEnd = thisMonthStart.AddDays(-1);

        var users = await _userRepository.GetAllAsync(cancellationToken);
        var thisMonthBookings = await _bookingRepository.GetAllByDateRangeAsync(thisMonthStart, today, cancellationToken);
        var lastMonthBookings = await _bookingRepository.GetAllByDateRangeAsync(lastMonthStart, lastMonthEnd, cancellationToken);
        var pendingPitches = await _pitchRepository.GetPagedAsync(1, 1, null, PitchStatus.PendingApproval, cancellationToken);
        var pendingOwnerCenters = await _context.SportCenters
            .AsNoTracking()
            .CountAsync(center => !center.IsActive && _context.Users.Any(user => user.Id == center.OwnerId && user.Role == UserRole.Customer), cancellationToken);

        const decimal commissionRate = 0.10m;
        var thisMonthRevenue = thisMonthBookings.Sum(b => b.TotalPrice.Amount) * commissionRate;
        var lastMonthRevenue = lastMonthBookings.Sum(b => b.TotalPrice.Amount) * commissionRate;

        var commissionGrowth = lastMonthRevenue > 0
            ? Math.Round((double)((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100), 1)
            : 0;

        var thisMonthUsers = users.Count(u => DateOnly.FromDateTime(u.CreatedAt) >= thisMonthStart);
        var lastMonthUsers = users.Count(u => DateOnly.FromDateTime(u.CreatedAt) >= lastMonthStart && DateOnly.FromDateTime(u.CreatedAt) < thisMonthStart);
        var userGrowth = lastMonthUsers > 0
            ? Math.Round((double)(thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100, 1)
            : 0;

        return Result<AdminDashboardStatsDto>.Success(new AdminDashboardStatsDto(
            users.Count,
            users.Count(u => u.Role == UserRole.PitchOwner && u.IsActive),
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

        return Result<OwnerDashboardStatsDto>.Success(new OwnerDashboardStatsDto(
            thisRevenue,
            confirmedThis.Count,
            uniqueCustomers,
            0, // AverageRating
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
            b.BookingDate.ToString("dd/MM/yyyy"),
            b.TimeSlot?.TimeRange.StartTime.ToString(@"hh\:mm") ?? "",
            b.TimeSlot?.TimeRange.EndTime.ToString(@"hh\:mm") ?? "",
            b.TotalPrice.Amount,
            b.Status.ToString()
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

        var summaries = new List<OwnerPitchSummaryDto>();
        foreach (var pitch in pitches)
        {
            var todayBookings = await _bookingRepository.GetByPitchesAndDateRangeAsync(
                new[] { pitch.Id }, today, today, cancellationToken);
            var confirmed = todayBookings.Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed).ToList();

            summaries.Add(new OwnerPitchSummaryDto(
                pitch.Id,
                pitch.Name,
                NormalizePitchType(pitch.Type).ToString(),
                GetPitchTypeDisplay(NormalizePitchType(pitch.Type)),
                pitch.Status.ToString(),
                confirmed.Count,
                confirmed.Sum(b => b.TotalPrice.Amount),
                (double)pitch.AverageRating,
                pitch.SportCenter?.Address?.GetFullAddress() ?? "",
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
            ));
        }

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
    private const decimal CommissionRate = 0.10m;
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

        var previousBookings = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.BookingDate >= previousFrom
                && b.BookingDate <= previousTo
                && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .ToListAsync(cancellationToken);

        var ownerIds = bookings
            .Select(b => b.TimeSlot.Pitch.OwnerId)
            .Distinct()
            .ToList();

        var owners = await _context.Users
            .AsNoTracking()
            .Where(u => ownerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var grossRevenue = bookings.Sum(b => b.TotalPrice.Amount);
        var platformCommission = grossRevenue * CommissionRate;
        var previousCommission = previousBookings.Sum(b => b.TotalPrice.Amount) * CommissionRate;
        var commissionGrowth = previousCommission > 0
            ? Math.Round((double)((platformCommission - previousCommission) / previousCommission * 100), 1)
            : 0;

        var trend = bookings
            .GroupBy(b => b.BookingDate)
            .Select(g => new AdminRevenueTrendPointDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Sum(b => b.TotalPrice.Amount),
                g.Sum(b => b.TotalPrice.Amount) * CommissionRate,
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
                    ownerGross * CommissionRate,
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
                    typeGross * CommissionRate,
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
                    b.TotalPrice.Amount * CommissionRate,
                    b.Status.ToString());
            })
            .ToList();

        return Result<AdminRevenueReportDto>.Success(new AdminRevenueReportDto(
            grossRevenue,
            platformCommission,
            grossRevenue - platformCommission,
            CommissionRate,
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
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;

    public GetPitchApprovalsQueryHandler(
        IPitchRepository pitchRepository,
        IUserRepository userRepository,
        IApplicationDbContext context)
    {
        _pitchRepository = pitchRepository;
        _userRepository = userRepository;
        _context = context;
    }

    public async Task<Result<PagedResult<PitchApprovalDto>>> Handle(GetPitchApprovalsQuery request, CancellationToken cancellationToken)
    {
        var normalizedStatus = NormalizeApprovalStatus(request.Status);
        Enum.TryParse<PitchStatus>(normalizedStatus, true, out var status);
        var paged = await _pitchRepository.GetPagedAsync(1, 50, null, status, cancellationToken);

        var dtos = new List<PitchApprovalDto>();
        if (status == PitchStatus.PendingApproval || status == PitchStatus.Active || status == PitchStatus.Inactive)
        {
            var ownerRole = status == PitchStatus.PendingApproval ? UserRole.Customer : UserRole.PitchOwner;
            var centerIsActive = status == PitchStatus.Active;
            var centers = await _context.SportCenters
                .AsNoTracking()
                .Where(center => center.IsActive == centerIsActive)
                .Join(
                    _context.Users.AsNoTracking().Where(user => user.Role == ownerRole),
                    center => center.OwnerId,
                    user => user.Id,
                    (center, user) => new { center, user })
                .OrderByDescending(item => item.center.CreatedAt)
                .Take(50)
                .ToListAsync(cancellationToken);

            dtos.AddRange(centers.Select(item => new PitchApprovalDto(
                item.center.Id,
                item.center.Name,
                item.user.FullName,
                item.user.Email,
                item.center.CreatedAt.ToString("o"),
                "OwnerRegistration",
                item.center.Address.GetFullAddress(),
                centerIsActive ? "approved" : "pending"
            )));
        }

        foreach (var pitch in paged.Items)
        {
            var owner = await _userRepository.GetByIdAsync(pitch.OwnerId, cancellationToken);
            dtos.Add(new PitchApprovalDto(
                pitch.Id,
                pitch.Name,
                owner?.FullName ?? "N/A",
                owner?.Email ?? "N/A",
                pitch.CreatedAt.ToString("o"),
                pitch.Type.ToString(),
                pitch.SportCenter?.Address?.ToString() ?? "N/A",
                pitch.Status == PitchStatus.PendingApproval ? "pending" : pitch.Status.ToString().ToLowerInvariant()
            ));
        }

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
