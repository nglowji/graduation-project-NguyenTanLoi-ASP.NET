using Application.Common.Models;
using MediatR;

namespace Application.Features.Bookings.Commands.CancelBooking;

public record CancelBookingCommand(
    Guid BookingId,
    Guid UserId,
    string Reason
) : IRequest<Result>;
