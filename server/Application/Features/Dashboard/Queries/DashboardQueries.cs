using Application.Common.DTOs;
using Application.Features.Dashboard.DTOs;
using MediatR;

namespace Application.Features.Dashboard.Queries;

public record GetAdminDashboardStatsQuery() : IRequest<Result<AdminDashboardStatsDto>>;

public record GetAdminRevenueReportQuery(DateOnly? FromDate, DateOnly? ToDate, int Days = 30)
    : IRequest<Result<AdminRevenueReportDto>>;

public record GetOwnerDashboardStatsQuery(Guid OwnerId) : IRequest<Result<OwnerDashboardStatsDto>>;

public record GetOwnerBookingsQuery(Guid OwnerId, string? Status, int PageNumber = 1, int PageSize = 20) 
    : IRequest<Result<PagedResult<OwnerBookingDto>>>;

public record GetOwnerPitchesQuery(Guid OwnerId) : IRequest<Result<List<OwnerPitchSummaryDto>>>;

public record GetAdminUsersQuery(string? Search, int? Role, int PageNumber = 1, int PageSize = 20) 
    : IRequest<Result<PagedResult<AdminUserDto>>>;

public record GetPitchApprovalsQuery(string Status = "pending") : IRequest<Result<PagedResult<PitchApprovalDto>>>;

public record SuspendUserCommand(Guid UserId) : IRequest<Result<bool>>;

public record ApprovePitchCommand(Guid PitchId) : IRequest<Result<bool>>;

public record RejectPitchCommand(Guid PitchId) : IRequest<Result<bool>>;
