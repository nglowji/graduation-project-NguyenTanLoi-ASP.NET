using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.Bookings.Commands.CreateBooking;

public record BookingServiceRequest(Guid ServiceId, int Quantity);

public record CreateBookingCommand(
    Guid UserId,
    Guid TimeSlotId,
    DateOnly BookingDate,
    List<BookingServiceRequest>? SelectedServices = null
) : IRequest<Result<Guid>>, ITransactionalRequest;
