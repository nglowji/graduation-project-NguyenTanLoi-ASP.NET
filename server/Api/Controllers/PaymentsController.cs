using Application.Common.DTOs;
using Application.Features.Payments.Commands.CreatePayment;
using Application.Features.Payments.Commands.ProcessCallback;
using Application.Features.Payments.Commands.ProcessZaloPayCallback;
using Application.Features.Payments.Queries.GetPaymentTransaction;
using Application.Features.Payments.Queries.GetUserPaymentHistory;
using Api.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
public class PaymentsController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IConfiguration _configuration;

    public PaymentsController(IMediator mediator, IConfiguration configuration)
    {
        _mediator = mediator;
        _configuration = configuration;
    }

    [HttpPost("create")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<CreatePaymentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePayment(
        [FromBody] CreatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var configuredReturnUrl = _configuration["VnPay:ReturnUrl"];
        if (request.Provider.Equals("ZALOPAY", StringComparison.OrdinalIgnoreCase))
            configuredReturnUrl = _configuration["ZaloPay:ReturnUrl"];

        var returnUrl = string.IsNullOrWhiteSpace(configuredReturnUrl)
            ? request.ReturnUrl
            : configuredReturnUrl;

        var callbackUrl = request.Provider.Equals("ZALOPAY", StringComparison.OrdinalIgnoreCase)
            ? BuildZaloPayCallbackUrl()
            : null;

        var command = new CreatePaymentCommand(
            request.BookingId,
            returnUrl,
            ipAddress,
            request.Provider,
            callbackUrl);

        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to create payment");

        return OkResponse(new CreatePaymentResponse(
            result.Value!.PaymentUrl,
            result.Value.Provider,
            result.Value.TransactionId,
            result.Value.QrCode
        ));
    }

    [HttpPost("zalopay/callback")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ZaloPayCallback(
        [FromBody] ZaloPayCallbackRequest request,
        CancellationToken cancellationToken)
    {
        var command = new ProcessZaloPayCallbackCommand(request.Data, request.Mac, request.Type);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess || result.Value is not { IsSuccess: true })
        {
            return Ok(new
            {
                return_code = 2,
                return_message = result.ErrorMessage ?? "Failed"
            });
        }

        return Ok(new
        {
            return_code = 1,
            return_message = "Success"
        });
    }

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
            return Redirect(BuildClientPaymentResultUrl(false, null, result.ErrorMessage));

        var callbackResult = result.Value;

        return callbackResult.IsSuccess
            ? Redirect(BuildClientPaymentResultUrl(true, callbackResult.BookingId, callbackResult.Message))
            : Redirect(BuildClientPaymentResultUrl(false, callbackResult.BookingId, callbackResult.Message));
    }

    [HttpGet("transactions/{transactionId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<PaymentTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransaction(
        Guid transactionId,
        CancellationToken cancellationToken)
    {
        var query = new GetPaymentTransactionQuery(transactionId);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFoundResponse(result.ErrorMessage ?? "Transaction not found");

        return OkResponse(result.Value);
    }

    [HttpGet("my-history")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PaymentHistoryDto>>), StatusCodes.Status200OK)]
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
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get payment history");

        return OkResponse(result.Value);
    }

    private string BuildClientPaymentResultUrl(bool success, Guid? bookingId, string? message)
    {
        var baseUrl = _configuration["ClientApp:PaymentResultUrl"]
            ?? _configuration["ClientApp:BaseUrl"]?.TrimEnd('/') + "/payment-result"
            ?? "http://localhost:5173/payment-result";

        var query = new List<string> { $"success={success.ToString().ToLowerInvariant()}" };
        if (bookingId.HasValue)
            query.Add($"bookingId={bookingId.Value}");
        if (!string.IsNullOrWhiteSpace(message))
            query.Add($"message={Uri.EscapeDataString(message)}");

        return $"{baseUrl}?{string.Join("&", query)}";
    }

    private string BuildZaloPayCallbackUrl()
    {
        var configuredCallbackUrl = _configuration["ZaloPay:CallbackUrl"];
        if (!string.IsNullOrWhiteSpace(configuredCallbackUrl))
            return configuredCallbackUrl;

        var request = HttpContext.Request;
        return $"{request.Scheme}://{request.Host}/api/v1/payments/zalopay/callback";
    }
}
