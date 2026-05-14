using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.Bookings.Commands.CancelBooking;

public record CancelBookingCommand(
    Guid BookingId,
    Guid RequesterId,
    string Reason
) : IRequest<Result>, ITransactionalRequest;
