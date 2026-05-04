using System.Net;
using System.Security.Cryptography;
using System.Text;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class VnpayPaymentService : IPaymentService
{
    private readonly IConfiguration _configuration;
    private readonly IApplicationDbContext _context;
    private readonly IBookingNotificationService _notificationService;
    private readonly ILogger<VnpayPaymentService> _logger;

    private readonly string _vnpayUrl;
    private readonly string _vnpayTmnCode;
    private readonly string _vnpayHashSecret;
    
    #region Constants
    
    // VNPAY API Constants
    private const string VNPAY_VERSION = "2.1.0";
    private const string COMMAND_PAY = "pay";
    private const string COMMAND_REFUND = "refund";
    private const string COMMAND_QUERY = "querydr";
    
    // Transaction Types
    private const string TRANSACTION_TYPE_FULL_REFUND = "02";
    private const string TRANSACTION_TYPE_PARTIAL_REFUND = "03";
    
    // Response Codes
    private const string RESPONSE_CODE_SUCCESS = "00";
    private const string RESPONSE_CODE_SUSPICIOUS = "07";
    private const string RESPONSE_CODE_NOT_REGISTERED = "09";
    private const string RESPONSE_CODE_WRONG_INFO = "10";
    private const string RESPONSE_CODE_TIMEOUT = "11";
    private const string RESPONSE_CODE_LOCKED = "12";
    private const string RESPONSE_CODE_WRONG_OTP = "13";
    private const string RESPONSE_CODE_USER_CANCELLED = "24";
    private const string RESPONSE_CODE_INSUFFICIENT_BALANCE = "51";
    private const string RESPONSE_CODE_DAILY_LIMIT = "65";
    private const string RESPONSE_CODE_BANK_MAINTENANCE = "75";
    private const string RESPONSE_CODE_WRONG_PASSWORD = "79";
    
    // Other Constants
    private const string CURRENCY_VND = "VND";
    private const string LOCALE_VN = "vn";
    private const string ORDER_TYPE_OTHER = "other";
    private const string DEFAULT_IP_ADDRESS = "127.0.0.1";
    private const string SYSTEM_USER = "System";
    private const int PAYMENT_EXPIRATION_MINUTES = 15;
    private const int API_TIMEOUT_SECONDS = 30;
    private const int AMOUNT_MULTIPLIER = 100; // VNPay requires amount in smallest unit
    
    #endregion

    public VnpayPaymentService(
        IConfiguration configuration,
        IApplicationDbContext context,
        IBookingNotificationService notificationService,
        ILogger<VnpayPaymentService> logger)
    {
        _configuration = configuration;
        _context = context;
        _notificationService = notificationService;
        _logger = logger;

        _vnpayUrl = configuration["VnPay:Url"] 
            ?? throw new InvalidOperationException("VnPay:Url is not configured");
        _vnpayTmnCode = configuration["VnPay:TmnCode"] 
            ?? throw new InvalidOperationException("VnPay:TmnCode is not configured");
        _vnpayHashSecret = configuration["VnPay:HashSecret"] 
            ?? throw new InvalidOperationException("VnPay:HashSecret is not configured");
    }

    #region Public Methods

    public async Task<Result<string>> CreatePaymentUrlAsync(
        Guid bookingId,
        decimal amount,
        string returnUrl,
        string ipAddress,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var booking = await GetBookingWithDetailsAsync(bookingId, cancellationToken);
            if (booking == null)
                return Result<string>.Failure("Booking not found");

            if (await HasSuccessfulPaymentAsync(bookingId, cancellationToken))
                return Result<string>.Failure("Booking already paid");

            var transaction = await GetOrCreateTransactionAsync(
                bookingId,
                Money.Create(amount, CURRENCY_VND),
                "VNPAY",
                cancellationToken
            );

            var paymentUrl = BuildPaymentUrl(booking, transaction, amount, returnUrl, ipAddress);

            _logger.LogInformation(
                "Created payment URL for booking {BookingId}, transaction {TransactionId}",
                bookingId,
                transaction.Id
            );

            return Result<string>.Success(paymentUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment URL for booking {BookingId}", bookingId);
            return Result<string>.Failure("Failed to create payment URL");
        }
    }

    public async Task<Result<PaymentCallbackResult>> ProcessPaymentCallbackAsync(
        Dictionary<string, string> queryParams,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ValidateSecureHash(queryParams))
            {
                _logger.LogWarning("Invalid secure hash in payment callback");
                return Result<PaymentCallbackResult>.Failure("Invalid payment signature");
            }

            var callbackData = ParseCallbackData(queryParams);
            var transaction = await GetTransactionWithBookingAsync(callbackData.TransactionId, cancellationToken);

            if (transaction == null)
            {
                _logger.LogWarning("Transaction {TransactionId} not found", callbackData.TransactionId);
                return Result<PaymentCallbackResult>.Failure("Transaction not found");
            }

            if (IsAlreadyProcessed(transaction))
            {
                return CreateAlreadyProcessedResult(transaction);
            }

            return await ProcessPaymentResultAsync(transaction, callbackData, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment callback");
            return Result<PaymentCallbackResult>.Failure("Failed to process payment callback");
        }
    }

    public async Task<Result> ProcessRefundAsync(
        Guid transactionId,
        decimal amount,
        string reason,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var transaction = await _context.PaymentTransactions
                .FirstOrDefaultAsync(pt => pt.Id == transactionId, cancellationToken);

            var validationResult = ValidateRefundTransaction(transaction);
            if (!validationResult.IsSuccess)
                return validationResult;

            var refundResult = await CallVnpayRefundApiAsync(
                transaction!.ProviderTxnId!,
                amount,
                reason,
                cancellationToken
            );

            if (!refundResult.IsSuccess)
            {
                _logger.LogError(
                    "VNPAY refund API failed for transaction {TransactionId}: {Error}",
                    transactionId,
                    refundResult.ErrorMessage
                );
                return refundResult;
            }

            transaction.Refund(reason);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Refund processed successfully for transaction {TransactionId}, amount: {Amount}",
                transactionId,
                amount
            );

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing refund for transaction {TransactionId}", transactionId);
            return Result.Failure("Failed to process refund");
        }
    }

    public async Task<Result<PaymentStatusResult>> QueryPaymentStatusAsync(
        string providerTxnId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrEmpty(providerTxnId))
                return Result<PaymentStatusResult>.Failure("Provider transaction ID is required");

            var transaction = await _context.PaymentTransactions
                .AsNoTracking()
                .FirstOrDefaultAsync(pt => pt.ProviderTxnId == providerTxnId, cancellationToken);

            if (transaction == null)
                return Result<PaymentStatusResult>.Failure("Transaction not found");

            var queryResult = await CallVnpayQueryApiAsync(
                providerTxnId,
                transaction.CreatedAt,
                cancellationToken
            );

            if (!queryResult.IsSuccess)
            {
                _logger.LogError(
                    "VNPAY query API failed for transaction {ProviderTxnId}: {Error}",
                    providerTxnId,
                    queryResult.ErrorMessage
                );
                return queryResult;
            }

            _logger.LogInformation(
                "Payment status queried successfully for transaction {ProviderTxnId}",
                providerTxnId
            );

            return queryResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying payment status for transaction {ProviderTxnId}", providerTxnId);
            return Result<PaymentStatusResult>.Failure("Failed to query payment status");
        }
    }

    #endregion

    #region Private Helper Methods - Database Operations

    private async Task<Booking?> GetBookingWithDetailsAsync(Guid bookingId, CancellationToken cancellationToken)
    {
        return await _context.Bookings
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);
    }

    private async Task<bool> HasSuccessfulPaymentAsync(Guid bookingId, CancellationToken cancellationToken)
    {
        return await _context.PaymentTransactions
            .AnyAsync(
                pt => pt.BookingId == bookingId && pt.Status == PaymentStatus.Success,
                cancellationToken
            );
    }

    private async Task<PaymentTransaction> GetOrCreateTransactionAsync(
        Guid bookingId,
        Money amount,
        string gateway,
        CancellationToken cancellationToken)
    {
        var existingTransaction = await _context.PaymentTransactions
            .FirstOrDefaultAsync(
                pt => pt.BookingId == bookingId && 
                      (pt.Status == PaymentStatus.Pending || pt.Status == PaymentStatus.Processing),
                cancellationToken
            );

        if (existingTransaction != null)
            return existingTransaction;

        var transaction = PaymentTransaction.Create(bookingId, amount, gateway);
        await _context.PaymentTransactions.AddAsync(transaction, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return transaction;
    }

    private async Task<PaymentTransaction?> GetTransactionWithBookingAsync(
        Guid transactionId,
        CancellationToken cancellationToken)
    {
        return await _context.PaymentTransactions
            .Include(pt => pt.Booking)
            .FirstOrDefaultAsync(pt => pt.Id == transactionId, cancellationToken);
    }

    #endregion

    #region Private Helper Methods - Payment URL Building

    private string BuildPaymentUrl(
        Booking booking,
        PaymentTransaction transaction,
        decimal amount,
        string returnUrl,
        string ipAddress)
    {
        var vnpayData = BuildPaymentRequestData(booking, transaction, amount, returnUrl, ipAddress);
        var queryString = BuildQueryString(vnpayData);
        var secureHash = ComputeHmacSha512(_vnpayHashSecret, queryString);
        
        return $"{_vnpayUrl}?{queryString}&vnp_SecureHash={secureHash}";
    }

    private SortedDictionary<string, string> BuildPaymentRequestData(
        Booking booking,
        PaymentTransaction transaction,
        decimal amount,
        string returnUrl,
        string ipAddress)
    {
        return new SortedDictionary<string, string>
        {
            { "vnp_Version", VNPAY_VERSION },
            { "vnp_Command", COMMAND_PAY },
            { "vnp_TmnCode", _vnpayTmnCode },
            { "vnp_Amount", ConvertToVnpayAmount(amount).ToString() },
            { "vnp_CreateDate", GetVnpayDateTimeFormat() },
            { "vnp_CurrCode", CURRENCY_VND },
            { "vnp_IpAddr", ipAddress },
            { "vnp_Locale", LOCALE_VN },
            { "vnp_OrderInfo", BuildOrderInfo(booking) },
            { "vnp_OrderType", ORDER_TYPE_OTHER },
            { "vnp_ReturnUrl", returnUrl },
            { "vnp_TxnRef", transaction.Id.ToString() },
            { "vnp_ExpireDate", GetVnpayExpirationDate() }
        };
    }

    #endregion

    #region Private Helper Methods - Callback Processing

    private bool ValidateSecureHash(Dictionary<string, string> queryParams)
    {
        var secureHash = queryParams.GetValueOrDefault("vnp_SecureHash");
        queryParams.Remove("vnp_SecureHash");
        queryParams.Remove("vnp_SecureHashType");

        var sortedParams = new SortedDictionary<string, string>(queryParams);
        var queryString = BuildQueryString(sortedParams);
        var computedHash = ComputeHmacSha512(_vnpayHashSecret, queryString);

        return secureHash?.Equals(computedHash, StringComparison.OrdinalIgnoreCase) ?? false;
    }

    private CallbackData ParseCallbackData(Dictionary<string, string> queryParams)
    {
        return new CallbackData(
            Guid.Parse(queryParams["vnp_TxnRef"]),
            queryParams["vnp_ResponseCode"],
            queryParams.GetValueOrDefault("vnp_TransactionNo"),
            ConvertFromVnpayAmount(queryParams["vnp_Amount"])
        );
    }

    private static bool IsAlreadyProcessed(PaymentTransaction transaction)
    {
        return transaction.Status == PaymentStatus.Success;
    }

    private static Result<PaymentCallbackResult> CreateAlreadyProcessedResult(PaymentTransaction transaction)
    {
        return Result<PaymentCallbackResult>.Success(new PaymentCallbackResult(
            transaction.BookingId,
            transaction.Id,
            true,
            "Payment already processed",
            transaction.ProviderTxnId
        ));
    }

    private async Task<Result<PaymentCallbackResult>> ProcessPaymentResultAsync(
        PaymentTransaction transaction,
        CallbackData callbackData,
        CancellationToken cancellationToken)
    {
        var isSuccess = IsSuccessResponseCode(callbackData.ResponseCode);

        if (isSuccess)
        {
            return await ProcessSuccessfulPaymentAsync(transaction, callbackData, cancellationToken);
        }
        else
        {
            return await ProcessFailedPaymentAsync(transaction, callbackData, cancellationToken);
        }
    }

    private async Task<Result<PaymentCallbackResult>> ProcessSuccessfulPaymentAsync(
        PaymentTransaction transaction,
        CallbackData callbackData,
        CancellationToken cancellationToken)
    {
        transaction.MarkAsProcessing(callbackData.ProviderTxnId!);
        transaction.MarkAsSuccess();
        transaction.Booking.Confirm();

        await _context.SaveChangesAsync(cancellationToken);

        // Notify real-time status update
        await _notificationService.NotifyTimeSlotStatusChangedAsync(
            transaction.Booking.TimeSlot.PitchId,
            transaction.Booking.TimeSlotId,
            "Confirmed",
            transaction.Booking.BookingDate,
            cancellationToken
        );

        _logger.LogInformation(
            "Payment successful for booking {BookingId}, transaction {TransactionId}",
            transaction.BookingId,
            transaction.Id
        );

        return Result<PaymentCallbackResult>.Success(new PaymentCallbackResult(
            transaction.BookingId,
            transaction.Id,
            true,
            "Payment successful",
            callbackData.ProviderTxnId
        ));
    }

    private async Task<Result<PaymentCallbackResult>> ProcessFailedPaymentAsync(
        PaymentTransaction transaction,
        CallbackData callbackData,
        CancellationToken cancellationToken)
    {
        var failureReason = GetVnpayResponseMessage(callbackData.ResponseCode);
        transaction.MarkAsFailed(failureReason);

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogWarning(
            "Payment failed for booking {BookingId}, reason: {Reason}",
            transaction.BookingId,
            failureReason
        );

        return Result<PaymentCallbackResult>.Success(new PaymentCallbackResult(
            transaction.BookingId,
            transaction.Id,
            false,
            failureReason,
            callbackData.ProviderTxnId
        ));
    }

    #endregion

    #region Private Helper Methods - Refund Validation

    private static Result ValidateRefundTransaction(PaymentTransaction? transaction)
    {
        if (transaction == null)
            return Result.Failure("Transaction not found");

        if (transaction.Status != PaymentStatus.Success)
            return Result.Failure("Only successful transactions can be refunded");

        if (string.IsNullOrEmpty(transaction.ProviderTxnId))
            return Result.Failure("Transaction does not have provider transaction ID");

        return Result.Success();
    }

    #endregion

    #region Private Helper Methods - VNPAY API Calls

    private async Task<Result> CallVnpayRefundApiAsync(
        string providerTxnId,
        decimal amount,
        string reason,
        CancellationToken cancellationToken)
    {
        try
        {
            var refundUrl = GetVnpayApiUrl("RefundUrl");
            var refundData = BuildRefundRequestData(providerTxnId, amount, reason);
            
            var responseContent = await CallVnpayApiAsync(refundUrl, refundData, cancellationToken);
            
            if (IsSuccessResponse(responseContent))
            {
                _logger.LogInformation(
                    "VNPAY refund successful for transaction {ProviderTxnId}",
                    providerTxnId
                );
                return Result.Success();
            }

            _logger.LogWarning(
                "VNPAY refund failed for transaction {ProviderTxnId}: {Response}",
                providerTxnId,
                responseContent
            );
            return Result.Failure("VNPAY refund request was rejected");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling VNPAY refund API for transaction {ProviderTxnId}", providerTxnId);
            return Result.Failure("Failed to call VNPAY refund API");
        }
    }

    private async Task<Result<PaymentStatusResult>> CallVnpayQueryApiAsync(
        string providerTxnId,
        DateTime transactionDate,
        CancellationToken cancellationToken)
    {
        try
        {
            var queryUrl = GetVnpayApiUrl("QueryUrl");
            var queryData = BuildQueryRequestData(providerTxnId, transactionDate);
            
            var responseContent = await CallVnpayApiAsync(queryUrl, queryData, cancellationToken);
            
            if (IsSuccessResponse(responseContent))
            {
                var isSuccess = IsTransactionSuccess(responseContent);
                var message = isSuccess ? "Transaction successful" : "Transaction failed or pending";

                _logger.LogInformation(
                    "VNPAY query successful for transaction {ProviderTxnId}: {Status}",
                    providerTxnId,
                    message
                );

                return Result<PaymentStatusResult>.Success(new PaymentStatusResult(
                    providerTxnId,
                    isSuccess,
                    message
                ));
            }

            _logger.LogWarning(
                "VNPAY query failed for transaction {ProviderTxnId}: {Response}",
                providerTxnId,
                responseContent
            );
            return Result<PaymentStatusResult>.Failure("VNPAY query request was rejected");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling VNPAY query API for transaction {ProviderTxnId}", providerTxnId);
            return Result<PaymentStatusResult>.Failure("Failed to call VNPAY query API");
        }
    }

    private string GetVnpayApiUrl(string configKey)
    {
        return _configuration[$"VnPay:{configKey}"] 
            ?? "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
    }

    private async Task<string> CallVnpayApiAsync(
        string apiUrl,
        SortedDictionary<string, string> requestData,
        CancellationToken cancellationToken)
    {
        using var httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(API_TIMEOUT_SECONDS)
        };

        var content = new FormUrlEncodedContent(requestData);
        var response = await httpClient.PostAsync(apiUrl, content, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "VNPAY API returned error status: {StatusCode}",
                response.StatusCode
            );
            throw new HttpRequestException($"VNPAY API request failed with status {response.StatusCode}");
        }

        return await response.Content.ReadAsStringAsync(cancellationToken);
    }

    private SortedDictionary<string, string> BuildRefundRequestData(
        string providerTxnId,
        decimal amount,
        string reason)
    {
        var requestId = Guid.NewGuid().ToString();
        var createDate = GetVnpayDateTimeFormat();

        var refundData = new SortedDictionary<string, string>
        {
            { "vnp_RequestId", requestId },
            { "vnp_Version", VNPAY_VERSION },
            { "vnp_Command", COMMAND_REFUND },
            { "vnp_TmnCode", _vnpayTmnCode },
            { "vnp_TransactionType", TRANSACTION_TYPE_FULL_REFUND },
            { "vnp_TxnRef", providerTxnId },
            { "vnp_Amount", ConvertToVnpayAmount(amount).ToString() },
            { "vnp_OrderInfo", reason },
            { "vnp_TransactionNo", providerTxnId },
            { "vnp_TransactionDate", createDate },
            { "vnp_CreateDate", createDate },
            { "vnp_CreateBy", SYSTEM_USER },
            { "vnp_IpAddr", DEFAULT_IP_ADDRESS }
        };

        AddSecureHash(refundData);
        return refundData;
    }

    private SortedDictionary<string, string> BuildQueryRequestData(
        string providerTxnId,
        DateTime transactionDate)
    {
        var requestId = Guid.NewGuid().ToString();
        var createDate = GetVnpayDateTimeFormat();
        var txnDate = GetVnpayDateTimeFormat(transactionDate);

        var queryData = new SortedDictionary<string, string>
        {
            { "vnp_RequestId", requestId },
            { "vnp_Version", VNPAY_VERSION },
            { "vnp_Command", COMMAND_QUERY },
            { "vnp_TmnCode", _vnpayTmnCode },
            { "vnp_TxnRef", providerTxnId },
            { "vnp_OrderInfo", "Query transaction status" },
            { "vnp_TransactionNo", providerTxnId },
            { "vnp_TransactionDate", txnDate },
            { "vnp_CreateDate", createDate },
            { "vnp_IpAddr", DEFAULT_IP_ADDRESS }
        };

        AddSecureHash(queryData);
        return queryData;
    }

    private void AddSecureHash(SortedDictionary<string, string> data)
    {
        var queryString = BuildQueryString(data);
        var secureHash = ComputeHmacSha512(_vnpayHashSecret, queryString);
        data.Add("vnp_SecureHash", secureHash);
    }

    #endregion

    #region Private Helper Methods - Utilities

    private static long ConvertToVnpayAmount(decimal amount)
    {
        return (long)(amount * AMOUNT_MULTIPLIER);
    }

    private static decimal ConvertFromVnpayAmount(string vnpayAmount)
    {
        return decimal.Parse(vnpayAmount) / AMOUNT_MULTIPLIER;
    }

    private static string GetVnpayDateTimeFormat(DateTime? dateTime = null)
    {
        var dt = dateTime ?? DateTime.Now;
        return dt.ToString("yyyyMMddHHmmss");
    }

    private static string GetVnpayExpirationDate()
    {
        return DateTime.Now.AddMinutes(PAYMENT_EXPIRATION_MINUTES).ToString("yyyyMMddHHmmss");
    }

    private static string BuildOrderInfo(Booking booking)
    {
        var pitchName = booking.TimeSlot?.Pitch?.Name ?? "Unknown";
        return $"Thanh toan dat san {pitchName}";
    }

    private static bool IsSuccessResponseCode(string responseCode)
    {
        return responseCode == RESPONSE_CODE_SUCCESS;
    }

    private static bool IsSuccessResponse(string responseContent)
    {
        return responseContent.Contains($"\"vnp_ResponseCode\":\"{RESPONSE_CODE_SUCCESS}\"");
    }

    private static bool IsTransactionSuccess(string responseContent)
    {
        return responseContent.Contains($"\"vnp_TransactionStatus\":\"{RESPONSE_CODE_SUCCESS}\"");
    }

    private static string BuildQueryString(SortedDictionary<string, string> data)
    {
        var queryString = new StringBuilder();
        foreach (var kvp in data)
        {
            if (!string.IsNullOrEmpty(kvp.Value))
            {
                if (queryString.Length > 0)
                    queryString.Append('&');

                queryString.Append(WebUtility.UrlEncode(kvp.Key));
                queryString.Append('=');
                queryString.Append(WebUtility.UrlEncode(kvp.Value));
            }
        }
        return queryString.ToString();
    }

    private static string ComputeHmacSha512(string key, string data)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA512(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);

        return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
    }

    private static string GetVnpayResponseMessage(string responseCode)
    {
        return responseCode switch
        {
            RESPONSE_CODE_SUCCESS => "Giao dịch thành công",
            RESPONSE_CODE_SUSPICIOUS => "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)",
            RESPONSE_CODE_NOT_REGISTERED => "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng",
            RESPONSE_CODE_WRONG_INFO => "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
            RESPONSE_CODE_TIMEOUT => "Giao dịch không thành công do: Đã hết hạn chờ thanh toán",
            RESPONSE_CODE_LOCKED => "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa",
            RESPONSE_CODE_WRONG_OTP => "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)",
            RESPONSE_CODE_USER_CANCELLED => "Giao dịch không thành công do: Khách hàng hủy giao dịch",
            RESPONSE_CODE_INSUFFICIENT_BALANCE => "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch",
            RESPONSE_CODE_DAILY_LIMIT => "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày",
            RESPONSE_CODE_BANK_MAINTENANCE => "Ngân hàng thanh toán đang bảo trì",
            RESPONSE_CODE_WRONG_PASSWORD => "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định",
            _ => $"Giao dịch thất bại (Mã lỗi: {responseCode})"
        };
    }

    #endregion

    #region Private Record Types

    private record CallbackData(
        Guid TransactionId,
        string ResponseCode,
        string? ProviderTxnId,
        decimal Amount
    );

    #endregion
}
