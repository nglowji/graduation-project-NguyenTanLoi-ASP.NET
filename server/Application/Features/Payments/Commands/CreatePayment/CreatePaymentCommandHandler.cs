using Application.Common.Interfaces;
using Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Commands.CreatePayment;

public class CreatePaymentCommandHandler : IRequestHandler<CreatePaymentCommand, Result<string>>
{
    private readonly IPaymentService _paymentService;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreatePaymentCommandHandler> _logger;

    public CreatePaymentCommandHandler(
        IPaymentService paymentService,
        IApplicationDbContext context,
        ILogger<CreatePaymentCommandHandler> logger)
    {
        _paymentService = paymentService;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(
        CreatePaymentCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Get booking with deposit amount
        var booking = await _context.Bookings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
            return Result<string>.Failure("Booking not found");

        // 2. Validate booking status
        if (booking.Status != Domain.Enums.BookingStatus.PendingDeposit)
            return Result<string>.Failure("Booking is not in pending deposit status");

        // 3. Create payment URL
        var result = await _paymentService.CreatePaymentUrlAsync(
            request.BookingId,
            booking.DepositAmount.Amount,
            request.ReturnUrl,
            request.IpAddress,
            cancellationToken
        );

        if (!result.IsSuccess)
            return result;

        _logger.LogInformation(
            "Payment URL created for booking {BookingId}",
            request.BookingId
        );

        return result;
    }
}
