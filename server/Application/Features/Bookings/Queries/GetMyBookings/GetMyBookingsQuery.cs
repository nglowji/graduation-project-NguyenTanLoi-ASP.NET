using Application.Common.DTOs;
using Application.Features.Bookings.DTOs;
using MediatR;

namespace Application.Features.Bookings.Queries.GetMyBookings;

public record GetMyBookingsQuery(
    Guid UserId,
    int PageNumber = 1,
    int PageSize = 10,
    string? Status = null
) : IRequest<Result<PagedResult<BookingDto>>>;
