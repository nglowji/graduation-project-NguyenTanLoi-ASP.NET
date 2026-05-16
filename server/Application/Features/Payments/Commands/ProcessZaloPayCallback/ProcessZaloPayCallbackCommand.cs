using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.Payments.Commands.ProcessZaloPayCallback;

public record ProcessZaloPayCallbackCommand(
    string Data,
    string Mac,
    int Type
) : IRequest<Result<PaymentCallbackResult>>, ITransactionalRequest;
