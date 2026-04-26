using Application.Common.Models;
using MediatR;

namespace Application.Features.Bookings.Commands.ConfirmBooking;

public record ConfirmBookingCommand(
    Guid BookingId,
    Guid OwnerId
) : IRequest<Result>;
