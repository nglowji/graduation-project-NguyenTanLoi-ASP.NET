using Application.Features.Payments.Commands.CreatePayment;
using Application.Features.Payments.Commands.ProcessCallback;
using Application.Features.Payments.Queries.GetPaymentTransaction;
using Application.Features.Payments.Queries.GetUserPaymentHistory;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IMediator mediator, ILogger<PaymentsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Create payment URL for booking deposit
    /// </summary>
    [HttpPost("create")]
    [Authorize]
    [ProducesResponseType(typeof(CreatePaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreatePayment(
        [FromBody] CreatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var command = new CreatePaymentCommand(
            request.BookingId,
            request.ReturnUrl,
            ipAddress
        );

        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Failed to create payment",
                Detail = result.ErrorMessage,
                Status = StatusCodes.Status400BadRequest
            });
        }

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
        {
            return Redirect($"/payment-failed?message={result.ErrorMessage}");
        }

        var callbackResult = result.Value;

        if (callbackResult.IsSuccess)
        {
            return Redirect($"/payment-success?bookingId={callbackResult.BookingId}");
        }
        else
        {
            return Redirect($"/payment-failed?bookingId={callbackResult.BookingId}&message={callbackResult.Message}");
        }
    }

    /// <summary>
    /// Get payment transaction details
    /// </summary>
    [HttpGet("transactions/{transactionId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PaymentTransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTransaction(
        Guid transactionId,
        CancellationToken cancellationToken)
    {
        var query = new GetPaymentTransactionQuery(transactionId);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Transaction not found",
                Detail = result.ErrorMessage,
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Get user's payment history
    /// </summary>
    [HttpGet("my-history")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResult<PaymentHistoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Failed to get payment history",
                Detail = result.ErrorMessage,
                Status = StatusCodes.Status400BadRequest
            });
        }

        return Ok(result.Value);
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return Guid.Empty;
    }
}

public record CreatePaymentRequest(
    Guid BookingId,
    string ReturnUrl
);

public record CreatePaymentResponse(
    string PaymentUrl
);
