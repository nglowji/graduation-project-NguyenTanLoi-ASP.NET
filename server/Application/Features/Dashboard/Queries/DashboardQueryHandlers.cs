using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Dashboard.DTOs;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Dashboard.Queries;

/// <summary>Handler for Admin dashboard stats</summary>
public class GetAdminDashboardStatsQueryHandler : IRequestHandler<GetAdminDashboardStatsQuery, Result<AdminDashboardStatsDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IPitchRepository _pitchRepository;

    public GetAdminDashboardStatsQueryHandler(IUserRepository userRepository, IBookingRepository bookingRepository, IPitchRepository pitchRepository)
    {
        _userRepository = userRepository;
        _bookingRepository = bookingRepository;
        _pitchRepository = pitchRepository;
    }

    public async Task<Result<AdminDashboardStatsDto>> Handle(GetAdminDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thisMonthStart = new DateOnly(today.Year, today.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var lastMonthEnd = thisMonthStart.AddDays(-1);

        // Fetch data in parallel
        var usersTask = _userRepository.GetAllAsync(cancellationToken);
        var thisMonthBookingsTask = _bookingRepository.GetAllByDateRangeAsync(thisMonthStart, today, cancellationToken);
        var lastMonthBookingsTask = _bookingRepository.GetAllByDateRangeAsync(lastMonthStart, lastMonthEnd, cancellationToken);
        var pendingPitchesTask = _pitchRepository.GetPagedAsync(1, 1, null, PitchStatus.PendingApproval, cancellationToken);

        await Task.WhenAll(usersTask, thisMonthBookingsTask, lastMonthBookingsTask, pendingPitchesTask);

        var users = await usersTask;
        var thisMonthBookings = await thisMonthBookingsTask;
        var lastMonthBookings = await lastMonthBookingsTask;
        var pendingPitches = await pendingPitchesTask;

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
            pendingPitches.TotalCount,
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
                pitch.Type.ToString(),
                pitch.Status.ToString(),
                confirmed.Count,
                confirmed.Sum(b => b.TotalPrice.Amount),
                (double)pitch.AverageRating
            ));
        }

        return Result<List<OwnerPitchSummaryDto>>.Success(summaries);
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

    public GetPitchApprovalsQueryHandler(IPitchRepository pitchRepository, IUserRepository userRepository)
    {
        _pitchRepository = pitchRepository;
        _userRepository = userRepository;
    }

    public async Task<Result<PagedResult<PitchApprovalDto>>> Handle(GetPitchApprovalsQuery request, CancellationToken cancellationToken)
    {
        Enum.TryParse<PitchStatus>(request.Status, true, out var status);
        var paged = await _pitchRepository.GetPagedAsync(1, 50, null, status, cancellationToken);

        var dtos = new List<PitchApprovalDto>();
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
                pitch.Address.ToString(),
                pitch.Status.ToString()
            ));
        }

        return Result<PagedResult<PitchApprovalDto>>.Success(
            new PagedResult<PitchApprovalDto>(dtos, paged.TotalCount, 1, 50));
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

    public ApprovePitchCommandHandler(IPitchRepository pitchRepository, IApplicationDbContext context)
    {
        _pitchRepository = pitchRepository;
        _context = context;
    }

    public async Task<Result<bool>> Handle(ApprovePitchCommand request, CancellationToken cancellationToken)
    {
        var pitch = await _pitchRepository.GetByIdAsync(request.PitchId, cancellationToken);
        if (pitch == null) return Result<bool>.Failure("Không tìm thấy sân");

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

    public RejectPitchCommandHandler(IPitchRepository pitchRepository, IApplicationDbContext context)
    {
        _pitchRepository = pitchRepository;
        _context = context;
    }

    public async Task<Result<bool>> Handle(RejectPitchCommand request, CancellationToken cancellationToken)
    {
        var pitch = await _pitchRepository.GetByIdAsync(request.PitchId, cancellationToken);
        if (pitch == null) return Result<bool>.Failure("Không tìm thấy sân");

        pitch.Deactivate(); // Or a specific Rejection status if added later
        await _pitchRepository.UpdateAsync(pitch, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
