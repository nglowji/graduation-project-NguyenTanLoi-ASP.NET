using Application.Common.Models;
using Application.Features.Bookings.DTOs;
using MediatR;

namespace Application.Features.Bookings.Queries.GetBookingById;

public record GetBookingByIdQuery(Guid BookingId) : IRequest<Result<BookingDto>>;
