using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Bookings.Commands.ConfirmBooking;

public record ConfirmBookingCommand(
    Guid BookingId,
    Guid RequesterId
) : IRequest<Result>;
