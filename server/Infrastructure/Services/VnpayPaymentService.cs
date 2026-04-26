using System.Globalization;
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
    private readonly ILogger<VnpayPaymentService> _logger;

    private readonly string _vnpayUrl;
    private readonly string _vnpayTmnCode;
    private readonly string _vnpayHashSecret;
    private readonly string _vnpayVersion = "2.1.0";
    private readonly string _vnpayCommand = "pay";

    public VnpayPaymentService(
        IConfiguration configuration,
        IApplicationDbContext context,
        ILogger<VnpayPaymentService> logger)
    {
        _configuration = configuration;
        _context = context;
        _logger = logger;

        _vnpayUrl = configuration["VnPay:Url"] 
            ?? throw new InvalidOperationException("VnPay:Url is not configured");
        _vnpayTmnCode = configuration["VnPay:TmnCode"] 
            ?? throw new InvalidOperationException("VnPay:TmnCode is not configured");
        _vnpayHashSecret = configuration["VnPay:HashSecret"] 
            ?? throw new InvalidOperationException("VnPay:HashSecret is not configured");
    }

    public async Task<Result<string>> CreatePaymentUrlAsync(
        Guid bookingId,
        decimal amount,
        string returnUrl,
        string ipAddress,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. Get booking
            var booking = await _context.Bookings
                .Include(b => b.TimeSlot)
                    .ThenInclude(ts => ts.Pitch)
                .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

            if (booking == null)
                return Result<string>.Failure("Booking not found");

            // 2. Check if already has successful payment
            var existingTransaction = await _context.PaymentTransactions
                .FirstOrDefaultAsync(
                    pt => pt.BookingId == bookingId && pt.Status == PaymentStatus.Success,
                    cancellationToken
                );

            if (existingTransaction != null)
                return Result<string>.Failure("Booking already paid");

            // 3. Create or get pending transaction
            var transaction = await GetOrCreateTransactionAsync(
                bookingId,
                Money.Create(amount, "VND"),
                "VNPAY",
                cancellationToken
            );

            // 4. Build VNPAY payment URL
            var vnpayData = new SortedDictionary<string, string>
            {
                { "vnp_Version", _vnpayVersion },
                { "vnp_Command", _vnpayCommand },
                { "vnp_TmnCode", _vnpayTmnCode },
                { "vnp_Amount", ((long)(amount * 100)).ToString() }, // VNPay requires amount in smallest unit
                { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") },
                { "vnp_CurrCode", "VND" },
                { "vnp_IpAddr", ipAddress },
                { "vnp_Locale", "vn" },
                { "vnp_OrderInfo", $"Thanh toan dat san {booking.TimeSlot?.Pitch?.Name}" },
                { "vnp_OrderType", "other" },
                { "vnp_ReturnUrl", returnUrl },
                { "vnp_TxnRef", transaction.Id.ToString() }, // Use transaction ID as reference
                { "vnp_ExpireDate", DateTime.Now.AddMinutes(15).ToString("yyyyMMddHHmmss") }
            };

            // 5. Build query string and secure hash
            var queryString = BuildQueryString(vnpayData);
            var secureHash = ComputeHmacSha512(_vnpayHashSecret, queryString);
            var paymentUrl = $"{_vnpayUrl}?{queryString}&vnp_SecureHash={secureHash}";

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
            // 1. Validate secure hash
            var secureHash = queryParams.GetValueOrDefault("vnp_SecureHash");
            queryParams.Remove("vnp_SecureHash");
            queryParams.Remove("vnp_SecureHashType");

            var sortedParams = new SortedDictionary<string, string>(queryParams);
            var queryString = BuildQueryString(sortedParams);
            var computedHash = ComputeHmacSha512(_vnpayHashSecret, queryString);

            if (!secureHash?.Equals(computedHash, StringComparison.OrdinalIgnoreCase) ?? true)
            {
                _logger.LogWarning("Invalid secure hash in payment callback");
                return Result<PaymentCallbackResult>.Failure("Invalid payment signature");
            }

            // 2. Parse callback data
            var transactionId = Guid.Parse(queryParams["vnp_TxnRef"]);
            var responseCode = queryParams["vnp_ResponseCode"];
            var providerTxnId = queryParams.GetValueOrDefault("vnp_TransactionNo");
            var amount = decimal.Parse(queryParams["vnp_Amount"]) / 100; // Convert back from smallest unit

            // 3. Get transaction
            var transaction = await _context.PaymentTransactions
                .Include(pt => pt.Booking)
                .FirstOrDefaultAsync(pt => pt.Id == transactionId, cancellationToken);

            if (transaction == null)
            {
                _logger.LogWarning("Transaction {TransactionId} not found", transactionId);
                return Result<PaymentCallbackResult>.Failure("Transaction not found");
            }

            // 4. Check if already processed (idempotency)
            if (transaction.Status == PaymentStatus.Success)
            {
                _logger.LogInformation(
                    "Transaction {TransactionId} already processed successfully",
                    transactionId
                );

                return Result<PaymentCallbackResult>.Success(new PaymentCallbackResult(
                    transaction.BookingId,
                    transaction.Id,
                    true,
                    "Payment already processed",
                    transaction.ProviderTxnId
                ));
            }

            // 5. Process payment result
            var isSuccess = responseCode == "00";

            if (isSuccess)
            {
                transaction.MarkAsProcessing(providerTxnId!);
                transaction.MarkAsSuccess();
                transaction.Booking.Confirm();

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Payment successful for booking {BookingId}, transaction {TransactionId}",
                    transaction.BookingId,
                    transactionId
                );

                return Result<PaymentCallbackResult>.Success(new PaymentCallbackResult(
                    transaction.BookingId,
                    transaction.Id,
                    true,
                    "Payment successful",
                    providerTxnId
                ));
            }
            else
            {
                var failureReason = GetVnpayResponseMessage(responseCode);
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
                    providerTxnId
                ));
            }
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

            if (transaction == null)
                return Result.Failure("Transaction not found");

            if (transaction.Status != PaymentStatus.Success)
                return Result.Failure("Only successful transactions can be refunded");

            transaction.Refund(reason);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Refund processed for transaction {TransactionId}, amount: {Amount}",
                transactionId,
                amount
            );

            // TODO: Call VNPAY refund API if needed
            // For now, we just mark as refunded in our system

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing refund for transaction {TransactionId}", transactionId);
            return Result.Failure("Failed to process refund");
        }
    }

    public Task<Result<PaymentStatusResult>> QueryPaymentStatusAsync(
        string providerTxnId,
        CancellationToken cancellationToken = default)
    {
        // TODO: Implement VNPAY query API
        throw new NotImplementedException("VNPAY query API not implemented yet");
    }

    private async Task<PaymentTransaction> GetOrCreateTransactionAsync(
        Guid bookingId,
        Money amount,
        string gateway,
        CancellationToken cancellationToken)
    {
        // Check for existing pending transaction
        var existingTransaction = await _context.PaymentTransactions
            .FirstOrDefaultAsync(
                pt => pt.BookingId == bookingId && 
                      (pt.Status == PaymentStatus.Pending || pt.Status == PaymentStatus.Processing),
                cancellationToken
            );

        if (existingTransaction != null)
            return existingTransaction;

        // Create new transaction
        var transaction = PaymentTransaction.Create(bookingId, amount, gateway);
        await _context.PaymentTransactions.AddAsync(transaction, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return transaction;
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
            "00" => "Giao dịch thành công",
            "07" => "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)",
            "09" => "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng",
            "10" => "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
            "11" => "Giao dịch không thành công do: Đã hết hạn chờ thanh toán",
            "12" => "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa",
            "13" => "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)",
            "24" => "Giao dịch không thành công do: Khách hàng hủy giao dịch",
            "51" => "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch",
            "65" => "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày",
            "75" => "Ngân hàng thanh toán đang bảo trì",
            "79" => "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định",
            _ => $"Giao dịch thất bại (Mã lỗi: {responseCode})"
        };
    }
}
