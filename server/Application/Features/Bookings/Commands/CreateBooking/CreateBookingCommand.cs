using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.Bookings.Commands.CreateBooking;

public record CreateBookingCommand(
    Guid UserId,
    Guid TimeSlotId,
    DateOnly BookingDate
) : IRequest<Result<Guid>>, ITransactionalRequest;
