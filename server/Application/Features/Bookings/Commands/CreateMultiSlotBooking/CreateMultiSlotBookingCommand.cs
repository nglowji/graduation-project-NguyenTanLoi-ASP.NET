using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Bookings.Commands.CreateBooking;
using MediatR;

namespace Application.Features.Bookings.Commands.CreateMultiSlotBooking;

public record BookingSlotRequest(
    Guid TimeSlotId,
    DateOnly BookingDate
);

public record CreateMultiSlotBookingCommand(
    Guid UserId,
    List<BookingSlotRequest> TimeSlots,
    List<BookingServiceRequest>? SelectedServices = null
) : IRequest<Result<List<Guid>>>, ITransactionalRequest;
