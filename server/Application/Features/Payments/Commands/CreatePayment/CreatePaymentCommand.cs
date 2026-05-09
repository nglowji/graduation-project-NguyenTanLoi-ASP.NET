using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Payments.Commands.CreatePayment;

public record CreatePaymentCommand(
    Guid BookingId,
    string ReturnUrl,
    string IpAddress
) : IRequest<Result<string>>; // Returns payment URL
