using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Bookings.Commands.CompleteBooking;

public record CompleteBookingCommand(
    Guid BookingId,
    Guid RequesterId
) : IRequest<Result>;
