using Application.Common.Models;
using MediatR;

namespace Application.Features.Bookings.Commands.CreateBooking;

public record CreateBookingCommand(
    Guid UserId,
    Guid TimeSlotId,
    DateOnly BookingDate
) : IRequest<Result<Guid>>;
