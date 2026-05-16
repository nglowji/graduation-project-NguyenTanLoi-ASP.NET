using Application.Common.DTOs;
using Application.Features.Dashboard.DTOs;
using MediatR;

namespace Application.Features.Dashboard.Queries;

public record GetOwnerDashboardQuery(
    Guid OwnerId,
    int Days = 30,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null
) : IRequest<Result<OwnerDashboardDto>>;
