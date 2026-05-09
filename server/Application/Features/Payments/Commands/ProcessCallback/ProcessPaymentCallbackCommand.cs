using Application.Common.Interfaces;
using Application.Common.DTOs;
using MediatR;

namespace Application.Features.Payments.Commands.ProcessCallback;

public record ProcessPaymentCallbackCommand(
    Dictionary<string, string> QueryParams
) : IRequest<Result<PaymentCallbackResult>>;
