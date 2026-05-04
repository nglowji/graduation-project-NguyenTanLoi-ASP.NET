using Application.Common.Models;
using Application.Features.Dashboard.DTOs;
using MediatR;

namespace Application.Features.Dashboard.Queries;

public record GetOwnerDashboardQuery(
    Guid OwnerId,
    int Days = 30
) : IRequest<Result<OwnerDashboardDto>>;
