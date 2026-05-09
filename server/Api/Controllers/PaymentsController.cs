using Application.Common.DTOs;
using Application.Features.Payments.Commands.CreatePayment;
using Application.Features.Payments.Commands.ProcessCallback;
using Application.Features.Payments.Queries.GetPaymentTransaction;
using Application.Features.Payments.Queries.GetUserPaymentHistory;
using Api.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
public class PaymentsController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public PaymentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Create payment URL for booking deposit
    /// </summary>
    [HttpPost("create")]
    [Authorize]
    [ProducesResponseType(typeof(CreatePaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePayment(
        [FromBody] CreatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var command = new CreatePaymentCommand(request.BookingId, request.ReturnUrl, ipAddress);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to create payment", result.ErrorMessage);

        return Ok(new CreatePaymentResponse(result.Value!));
    }

    /// <summary>
    /// VNPAY payment callback (called by VNPAY after payment)
    /// </summary>
    [HttpGet("callback")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> PaymentCallback(CancellationToken cancellationToken)
    {
        var queryParams = Request.Query.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.ToString()
        );

        var command = new ProcessPaymentCallbackCommand(queryParams);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess || result.Value == null)
            return Redirect($"/payment-failed?message={result.ErrorMessage}");

        var callbackResult = result.Value;

        return callbackResult.IsSuccess
            ? Redirect($"/payment-success?bookingId={callbackResult.BookingId}")
            : Redirect($"/payment-failed?bookingId={callbackResult.BookingId}&message={callbackResult.Message}");
    }

    /// <summary>
    /// Get payment transaction details
    /// </summary>
    [HttpGet("transactions/{transactionId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PaymentTransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransaction(
        Guid transactionId,
        CancellationToken cancellationToken)
    {
        var query = new GetPaymentTransactionQuery(transactionId);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFoundProblem("Transaction not found", result.ErrorMessage);

        return Ok(result.Value);
    }

    /// <summary>
    /// Get user's payment history
    /// </summary>
    [HttpGet("my-history")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResult<PaymentHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPaymentHistory(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var query = new GetUserPaymentHistoryQuery(userId, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestProblem("Failed to get payment history", result.ErrorMessage);

        return Ok(result.Value);
    }
}
