using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Payments.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class ZaloPayPaymentService : IPaymentGateway
{
    public string Provider => GatewayName;

    private const string GatewayName = "ZALOPAY";
    private const string CurrencyVnd = "VND";
    private const int CallbackTypeOrder = 1;
    private const int SuccessReturnCode = 1;
    private const int FailedReturnCode = 2;
    private const int ProcessingReturnCode = 3;
    private const int PaymentExpirationSeconds = 900;
    private const string PreferredWalletPaymentMethod = "zalopay_wallet";
    private const string DefaultApiEndpoint = "https://sb-openapi.zalopay.vn/v2/create";
    private const string DefaultQueryEndpoint = "https://sb-openapi.zalopay.vn/v2/query";

    private readonly HttpClient _httpClient;
    private readonly IApplicationDbContext _context;
    private readonly IBookingNotificationService _notificationService;
    private readonly ILogger<ZaloPayPaymentService> _logger;
    private readonly ZaloPayOptions _options;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public ZaloPayPaymentService(
        HttpClient httpClient,
        IConfiguration configuration,
        IApplicationDbContext context,
        IBookingNotificationService notificationService,
        ILogger<ZaloPayPaymentService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
        _options = ZaloPayOptions.FromConfiguration(configuration);
    }

    public async Task<Result<PaymentInitResult>> CreatePaymentAsync(
        PaymentGatewayCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var validation = ValidateCreatePaymentRequest(request);
            if (!validation.IsSuccess)
                return Result<PaymentInitResult>.Failure(validation.ErrorMessage!);

            var booking = await GetBookingWithDetailsAsync(request.BookingId, cancellationToken);
            if (booking == null)
                return Result<PaymentInitResult>.Failure("Booking not found");

            if (await HasSuccessfulPaymentAsync(request.BookingId, cancellationToken))
                return Result<PaymentInitResult>.Failure("Booking already paid");

            var transaction = await GetOrCreateTransactionAsync(
                request.BookingId,
                Money.Create(request.Amount, CurrencyVnd),
                cancellationToken);

            var requestData = BuildCreateOrderRequest(
                booking,
                transaction,
                request.Amount,
                request.ReturnUrl,
                request.CallbackUrl);

            var response = await SendCreateOrderRequestAsync(requestData, cancellationToken);
            if (!IsCreateOrderAccepted(response))
            {
                _logger.LogWarning(
                    "ZaloPay create order failed for booking {BookingId}: {Code} - {Message}",
                    request.BookingId,
                    response.ReturnCode,
                    response.ReturnMessage);

                return Result<PaymentInitResult>.Failure(response.ReturnMessage ?? "ZaloPay rejected the payment request");
            }

            return CreatePaymentInitResult(request.BookingId, transaction.Id, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating ZaloPay order for booking {BookingId}", request.BookingId);
            return Result<PaymentInitResult>.Failure("Failed to create ZaloPay payment URL");
        }
    }

    public async Task<Result<PaymentCallbackResult>> ProcessCallbackAsync(
        PaymentGatewayCallback callback,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (callback.Type != CallbackTypeOrder)
                return Result<PaymentCallbackResult>.Failure("Unsupported ZaloPay callback type");

            if (!ValidateCallbackMac(callback.Data ?? string.Empty, callback.Mac ?? string.Empty))
            {
                _logger.LogWarning("Invalid ZaloPay callback signature");
                return Result<PaymentCallbackResult>.Failure("Invalid payment signature");
            }

            var callbackData = ParseCallbackData(callback.Data ?? string.Empty);
            var transactionId = ParseTransactionId(callbackData.AppTransId);
            var transaction = await GetTransactionWithBookingAsync(transactionId, cancellationToken);
            if (transaction == null)
                return Result<PaymentCallbackResult>.Failure("Transaction not found");

            if (transaction.Status == PaymentStatus.Success)
            {
                return Result<PaymentCallbackResult>.Success(new PaymentCallbackResult(
                    transaction.BookingId,
                    transaction.Id,
                    true,
                    "Payment already processed",
                    transaction.ProviderTxnId));
            }

            await MarkPaymentSucceededAsync(
                transaction,
                callbackData.ZpTransId.ToString(CultureInfo.InvariantCulture),
                cancellationToken);

            return Result<PaymentCallbackResult>.Success(new PaymentCallbackResult(
                transaction.BookingId,
                transaction.Id,
                true,
                "Payment successful",
                transaction.ProviderTxnId));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing ZaloPay callback");
            return Result<PaymentCallbackResult>.Failure("Failed to process ZaloPay callback");
        }
    }

    public async Task<Result> SynchronizePaymentAsync(
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!_options.HasValidCredentials)
                return Result.Failure("ZaloPay is not configured");

            var transaction = await GetTransactionWithBookingAsync(transactionId, cancellationToken);
            if (transaction == null)
                return Result.Failure("Transaction not found");

            if (transaction.Gateway != GatewayName || !transaction.IsPending())
                return Result.Success();

            var appTransId = BuildAppTransId(transaction.Id, transaction.TransactionDate);
            var queryResult = await QueryOrderAsync(appTransId, cancellationToken);

            if (queryResult.ReturnCode == SuccessReturnCode)
            {
                return await SynchronizeSuccessfulPaymentAsync(transaction, queryResult.ZpTransId, cancellationToken);
            }

            if (queryResult.ReturnCode == FailedReturnCode)
            {
                return await MarkPaymentFailedAsync(transaction, queryResult.ReturnMessage, cancellationToken);
            }

            if (queryResult.ReturnCode == ProcessingReturnCode || queryResult.IsProcessing)
                return Result.Success();

            return Result.Failure(queryResult.ReturnMessage ?? "Unable to synchronize ZaloPay payment");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error synchronizing ZaloPay transaction {TransactionId}", transactionId);
            return Result.Failure("Failed to synchronize ZaloPay payment");
        }
    }

    private Result ValidateCreatePaymentRequest(PaymentGatewayCreateRequest request)
    {
        if (!_options.HasValidCredentials)
            return Result.Failure("ZaloPay is not configured");

        if (string.IsNullOrWhiteSpace(request.CallbackUrl))
            return Result.Failure("ZaloPay callback URL is required");

        return Result.Success();
    }

    private Result<PaymentInitResult> CreatePaymentInitResult(
        Guid bookingId,
        Guid transactionId,
        ZaloPayCreateOrderResponse response)
    {
        _logger.LogInformation(
            "Created ZaloPay order for booking {BookingId}, transaction {TransactionId}",
            bookingId,
            transactionId);

        return Result<PaymentInitResult>.Success(new PaymentInitResult(
            transactionId,
            GatewayName,
            response.OrderUrl ?? string.Empty,
            response.QrCode));
    }

    private static bool IsCreateOrderAccepted(ZaloPayCreateOrderResponse response)
    {
        return response.ReturnCode == SuccessReturnCode &&
               (!string.IsNullOrWhiteSpace(response.QrCode) ||
                !string.IsNullOrWhiteSpace(response.OrderUrl));
    }

    private async Task<Result> SynchronizeSuccessfulPaymentAsync(
        PaymentTransaction transaction,
        long providerTransactionId,
        CancellationToken cancellationToken)
    {
        await MarkPaymentSucceededAsync(
            transaction,
            providerTransactionId.ToString(CultureInfo.InvariantCulture),
            cancellationToken);

        return Result.Success();
    }

    private async Task<Result> MarkPaymentFailedAsync(
        PaymentTransaction transaction,
        string? reason,
        CancellationToken cancellationToken)
    {
        transaction.MarkAsFailed(reason ?? "ZaloPay payment failed");
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

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
                cancellationToken);
    }

    private async Task<PaymentTransaction> GetOrCreateTransactionAsync(
        Guid bookingId,
        Money amount,
        CancellationToken cancellationToken)
    {
        var existingTransaction = await _context.PaymentTransactions
            .Where(pt => pt.BookingId == bookingId && (pt.Status == PaymentStatus.Pending || pt.Status == PaymentStatus.Processing))
            .OrderByDescending(pt => pt.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingTransaction == null)
        {
            var transaction = PaymentTransaction.Create(bookingId, amount, GatewayName);
            await _context.PaymentTransactions.AddAsync(transaction, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return transaction;
        }

        if (existingTransaction.Gateway != GatewayName)
            throw new InvalidOperationException("Booking already has a payment transaction with another gateway");

        if (!existingTransaction.IsPending())
            throw new InvalidOperationException("Existing payment transaction cannot be reused");

        return existingTransaction;
    }

    private async Task<PaymentTransaction?> GetTransactionWithBookingAsync(
        Guid transactionId,
        CancellationToken cancellationToken)
    {
        return await _context.PaymentTransactions
            .Include(pt => pt.Booking)
                .ThenInclude(b => b.TimeSlot)
            .FirstOrDefaultAsync(pt => pt.Id == transactionId, cancellationToken);
    }

    private void ApplySuccessfulPayment(PaymentTransaction transaction, string providerTxnId)
    {
        if (transaction.Status == PaymentStatus.Pending)
            transaction.MarkAsProcessing(providerTxnId);

        if (transaction.Status == PaymentStatus.Processing)
            transaction.MarkAsSuccess();

        if (transaction.Booking.Status == BookingStatus.PendingDeposit)
            transaction.Booking.Confirm();
    }

    private async Task MarkPaymentSucceededAsync(
        PaymentTransaction transaction,
        string providerTxnId,
        CancellationToken cancellationToken)
    {
        ApplySuccessfulPayment(transaction, providerTxnId);

        await _context.SaveChangesAsync(cancellationToken);
        await NotifySuccessfulPaymentAsync(transaction, cancellationToken);

        _logger.LogInformation(
            "ZaloPay payment successful for booking {BookingId}, transaction {TransactionId}",
            transaction.BookingId,
            transaction.Id);
    }

    private async Task NotifySuccessfulPaymentAsync(
        PaymentTransaction transaction,
        CancellationToken cancellationToken)
    {
        await _notificationService.NotifyTimeSlotStatusChangedAsync(
            transaction.Booking.TimeSlot.PitchId,
            transaction.Booking.TimeSlotId,
            "Confirmed",
            transaction.Booking.BookingDate,
            cancellationToken);

        await _notificationService.NotifyPaymentSucceededAsync(
            transaction.Booking.TimeSlot.PitchId,
            transaction.BookingId,
            transaction.Amount.Amount,
            transaction.Booking.BookingDate,
            cancellationToken);
    }

    private SortedDictionary<string, string> BuildCreateOrderRequest(
        Booking booking,
        PaymentTransaction transaction,
        decimal amount,
        string returnUrl,
        string callbackUrl)
    {
        var appTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var appTransId = BuildAppTransId(transaction.Id, transaction.TransactionDate);
        var appUser = booking.UserId.ToString("N")[..20];
        var roundedAmount = decimal.ToInt64(decimal.Round(amount, 0, MidpointRounding.AwayFromZero));
        var embedData = JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["redirecturl"] = BuildRedirectUrl(returnUrl, booking.Id, transaction.Id),
            ["bookingId"] = booking.Id.ToString(),
            ["transactionId"] = transaction.Id.ToString(),
            ["preferred_payment_method"] = new[] { PreferredWalletPaymentMethod }
        });
        var item = JsonSerializer.Serialize(new[]
        {
            new
            {
                itemid = booking.Id.ToString(),
                itemname = booking.TimeSlot?.Pitch?.Name ?? "SmartSport booking",
                itemprice = roundedAmount,
                itemquantity = 1
            }
        });

        var requestData = new SortedDictionary<string, string>
        {
            ["app_id"] = _options.AppId.ToString(CultureInfo.InvariantCulture),
            ["app_user"] = appUser,
            ["app_trans_id"] = appTransId,
            ["app_time"] = appTime.ToString(CultureInfo.InvariantCulture),
            ["amount"] = roundedAmount.ToString(CultureInfo.InvariantCulture),
            ["description"] = BuildDescription(booking),
            ["callback_url"] = callbackUrl,
            ["item"] = item,
            ["embed_data"] = embedData,
            ["expire_duration_seconds"] = PaymentExpirationSeconds.ToString(CultureInfo.InvariantCulture),
            ["bank_code"] = string.Empty
        };

        requestData["mac"] = ComputeMac(BuildCreateOrderMacInput(requestData), _options.Key1);
        return requestData;
    }

    private async Task<ZaloPayCreateOrderResponse> SendCreateOrderRequestAsync(
        SortedDictionary<string, string> requestData,
        CancellationToken cancellationToken)
    {
        using var content = new FormUrlEncodedContent(requestData);
        var response = await _httpClient.PostAsync(_options.ApiEndpoint, content, cancellationToken);
        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"ZaloPay returned status {response.StatusCode}: {responseJson}");

        return JsonSerializer.Deserialize<ZaloPayCreateOrderResponse>(
            responseJson,
            JsonOptions) ?? new ZaloPayCreateOrderResponse();
    }

    private async Task<ZaloPayQueryOrderResponse> QueryOrderAsync(
        string appTransId,
        CancellationToken cancellationToken)
    {
        var macInput = $"{_options.AppId}|{appTransId}|{_options.Key1}";
        var requestData = new SortedDictionary<string, string>
        {
            ["app_id"] = _options.AppId.ToString(CultureInfo.InvariantCulture),
            ["app_trans_id"] = appTransId,
            ["mac"] = ComputeMac(macInput, _options.Key1)
        };

        using var content = new FormUrlEncodedContent(requestData);
        var response = await _httpClient.PostAsync(_options.QueryEndpoint, content, cancellationToken);
        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"ZaloPay query returned status {response.StatusCode}: {responseJson}");

        return JsonSerializer.Deserialize<ZaloPayQueryOrderResponse>(
            responseJson,
            JsonOptions) ?? new ZaloPayQueryOrderResponse();
    }

    private bool ValidateCallbackMac(string data, string mac)
    {
        if (string.IsNullOrWhiteSpace(data) || string.IsNullOrWhiteSpace(mac))
            return false;

        var computedMac = ComputeMac(data, _options.Key2);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedMac),
            Encoding.UTF8.GetBytes(mac.ToLowerInvariant()));
    }

    private static ZaloPayCallbackData ParseCallbackData(string data)
    {
        return JsonSerializer.Deserialize<ZaloPayCallbackData>(
            data,
            JsonOptions) ?? throw new InvalidOperationException("Invalid ZaloPay callback data");
    }

    private static Guid ParseTransactionId(string appTransId)
    {
        var separatorIndex = appTransId.IndexOf('_', StringComparison.Ordinal);
        if (separatorIndex < 0 || separatorIndex == appTransId.Length - 1)
            throw new InvalidOperationException("Invalid ZaloPay app_trans_id");

        return Guid.ParseExact(appTransId[(separatorIndex + 1)..], "N");
    }

    private static string BuildAppTransId(Guid transactionId, DateTime transactionDate)
    {
        var vietnamTime = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
            new DateTimeOffset(DateTime.SpecifyKind(transactionDate, DateTimeKind.Utc)),
            "SE Asia Standard Time");

        return $"{vietnamTime:yyMMdd}_{transactionId:N}";
    }

    private static string BuildCreateOrderMacInput(IReadOnlyDictionary<string, string> requestData)
    {
        return string.Join(
            "|",
            requestData["app_id"],
            requestData["app_trans_id"],
            requestData["app_user"],
            requestData["amount"],
            requestData["app_time"],
            requestData["embed_data"],
            requestData["item"]);
    }

    private static string BuildDescription(Booking booking)
    {
        var pitchName = booking.TimeSlot?.Pitch?.Name ?? "SmartSport";
        return $"Thanh toan coc dat san {pitchName}";
    }

    private static string BuildRedirectUrl(string returnUrl, Guid bookingId, Guid transactionId)
    {
        var separator = returnUrl.Contains('?', StringComparison.Ordinal) ? "&" : "?";
        return $"{returnUrl}{separator}provider=ZALOPAY&bookingId={bookingId}&transactionId={transactionId}&pending=true";
    }

    private static string ComputeMac(string data, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA256(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }

    private sealed record ZaloPayOptions(
        int AppId,
        string Key1,
        string Key2,
        string ApiEndpoint,
        string QueryEndpoint)
    {
        public bool HasValidCredentials =>
            AppId > 0 &&
            !string.IsNullOrWhiteSpace(Key1) &&
            !string.IsNullOrWhiteSpace(Key2);

        public static ZaloPayOptions FromConfiguration(IConfiguration configuration)
        {
            var appIdText = GetFirstConfiguredValue(configuration, "ZaloPay:AppId", "ZALO_APP_ID");
            _ = int.TryParse(appIdText, NumberStyles.Integer, CultureInfo.InvariantCulture, out var appId);

            return new ZaloPayOptions(
                appId,
                GetFirstConfiguredValue(configuration, "ZaloPay:Key1", "ZALO_KEY1"),
                GetFirstConfiguredValue(configuration, "ZaloPay:Key2", "ZALO_KEY2"),
                GetFirstConfiguredValue(configuration, "ZaloPay:ApiEndpoint", "ZALO_API_ENDPOINT", DefaultApiEndpoint),
                GetFirstConfiguredValue(configuration, "ZaloPay:QueryEndpoint", "ZALO_QUERY_ENDPOINT", DefaultQueryEndpoint));
        }

        private static string GetFirstConfiguredValue(
            IConfiguration configuration,
            string primaryKey,
            string fallbackKey,
            string defaultValue = "")
        {
            var primaryValue = configuration[primaryKey];
            if (!string.IsNullOrWhiteSpace(primaryValue))
                return primaryValue.Trim();

            var fallbackValue = configuration[fallbackKey];
            if (!string.IsNullOrWhiteSpace(fallbackValue))
                return fallbackValue.Trim();

            return defaultValue;
        }
    }

    private sealed record ZaloPayCreateOrderResponse
    {
        [JsonPropertyName("return_code")]
        public int ReturnCode { get; init; }

        [JsonPropertyName("return_message")]
        public string? ReturnMessage { get; init; }

        [JsonPropertyName("sub_return_code")]
        public int SubReturnCode { get; init; }

        [JsonPropertyName("sub_return_message")]
        public string? SubReturnMessage { get; init; }

        [JsonPropertyName("order_url")]
        public string? OrderUrl { get; init; }

        [JsonPropertyName("zp_trans_token")]
        public string? ZpTransToken { get; init; }

        [JsonPropertyName("order_token")]
        public string? OrderToken { get; init; }

        [JsonPropertyName("qr_code")]
        public string? QrCode { get; init; }
    }

    private sealed record ZaloPayCallbackData
    {
        [JsonPropertyName("app_id")]
        public int AppId { get; init; }

        [JsonPropertyName("app_trans_id")]
        public string AppTransId { get; init; } = string.Empty;

        [JsonPropertyName("app_time")]
        public long AppTime { get; init; }

        [JsonPropertyName("app_user")]
        public string AppUser { get; init; } = string.Empty;

        [JsonPropertyName("amount")]
        public long Amount { get; init; }

        [JsonPropertyName("embed_data")]
        public string EmbedData { get; init; } = string.Empty;

        [JsonPropertyName("item")]
        public string Item { get; init; } = string.Empty;

        [JsonPropertyName("zp_trans_id")]
        public long ZpTransId { get; init; }

        [JsonPropertyName("server_time")]
        public long ServerTime { get; init; }

        [JsonPropertyName("channel")]
        public int Channel { get; init; }

        [JsonPropertyName("user_fee_amount")]
        public long UserFeeAmount { get; init; }

        [JsonPropertyName("discount_amount")]
        public long DiscountAmount { get; init; }
    }

    private sealed record ZaloPayQueryOrderResponse
    {
        [JsonPropertyName("return_code")]
        public int ReturnCode { get; init; }

        [JsonPropertyName("return_message")]
        public string? ReturnMessage { get; init; }

        [JsonPropertyName("sub_return_code")]
        public int SubReturnCode { get; init; }

        [JsonPropertyName("sub_return_message")]
        public string? SubReturnMessage { get; init; }

        [JsonPropertyName("is_processing")]
        public bool IsProcessing { get; init; }

        [JsonPropertyName("amount")]
        public long Amount { get; init; }

        [JsonPropertyName("zp_trans_id")]
        public long ZpTransId { get; init; }

        [JsonPropertyName("server_time")]
        public long ServerTime { get; init; }

        [JsonPropertyName("discount_amount")]
        public long DiscountAmount { get; init; }
    }
}
