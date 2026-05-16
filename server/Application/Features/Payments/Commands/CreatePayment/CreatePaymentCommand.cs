using Application.Common.DTOs;
using Application.Features.Payments.DTOs;
using MediatR;

namespace Application.Features.Payments.Commands.CreatePayment;

public record CreatePaymentCommand(
    Guid BookingId,
    string ReturnUrl,
    string IpAddress,
    string Provider = "VNPAY",
    string? CallbackUrl = null
) : IRequest<Result<PaymentInitResult>>; // Returns payment init data
