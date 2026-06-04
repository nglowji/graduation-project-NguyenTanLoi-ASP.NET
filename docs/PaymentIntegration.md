# Payment Integration Guide (VNPAY)

## 🎯 Overview

Hệ thống tích hợp VNPAY Sandbox để xử lý thanh toán tiền cọc đặt sân. Đảm bảo:
- ✅ Secure payment với HMAC-SHA512
- ✅ Idempotency - Không duplicate payment
- ✅ Automatic booking confirmation sau khi thanh toán thành công
- ✅ Refund support cho cancelled bookings

## 📋 Payment Flow

### Complete Booking & Payment Flow

```
1. User locks time slot
   POST /api/v1/bookings/lock
   → Lock ID returned
   
2. User creates booking
   POST /api/v1/bookings
   → Booking created with status: PendingDeposit
   → Lock auto-released
   
3. User initiates payment
   POST /api/v1/payments/create
   → Payment URL returned
   
4. User redirected to VNPAY
   → User completes payment on VNPAY
   
5. VNPAY callback
   GET /api/v1/payments/callback?vnp_...
   → Verify signature
   → Update transaction status
   → Confirm booking (status: Confirmed)
   → Redirect to success/failure page
   
6. User sees confirmation
   → Booking confirmed
   → Receipt sent via email (future)
```

## 🔐 VNPAY Configuration

### 1. Get VNPAY Credentials

**Sandbox (Testing)**:
- URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- Register at: https://sandbox.vnpayment.vn/
- Get: `TmnCode` and `HashSecret`

**Production**:
- URL: `https://vnpayment.vn/paymentv2/vpcpay.html`
- Contact VNPAY for production credentials

### 2. Configure appsettings.json

```json
{
  "VnPay": {
    "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "TmnCode": "YOUR_TMN_CODE",
    "HashSecret": "YOUR_HASH_SECRET",
    "ReturnUrl": "https://yourdomain.com/api/v1/payments/callback"
  }
}
```

### 3. Environment Variables (Production)

```bash
VnPay__TmnCode=YOUR_PRODUCTION_TMN_CODE
VnPay__HashSecret=YOUR_PRODUCTION_HASH_SECRET
VnPay__ReturnUrl=https://yourdomain.com/api/v1/payments/callback
```

## 🚀 API Endpoints

### 1. Create Payment URL

**Endpoint**: `POST /api/v1/payments/create`

**Request**:
```json
{
  "bookingId": "guid",
  "returnUrl": "https://yourfrontend.com/payment-result"
}
```

**Response**:
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=..."
}
```

**Example**:
```bash
curl -X POST https://localhost:5001/api/v1/payments/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "123e4567-e89b-12d3-a456-426614174000",
    "returnUrl": "https://yourfrontend.com/payment-result"
  }'
```

### 2. Payment Callback (VNPAY calls this)

**Endpoint**: `GET /api/v1/payments/callback`

**Query Parameters** (from VNPAY):
```
vnp_Amount=50000000
vnp_BankCode=NCB
vnp_BankTranNo=VNP01234567
vnp_CardType=ATM
vnp_OrderInfo=Thanh toan dat san
vnp_PayDate=20241225103000
vnp_ResponseCode=00
vnp_TmnCode=DEMO123
vnp_TransactionNo=14123456
vnp_TransactionStatus=00
vnp_TxnRef=guid
vnp_SecureHash=abc123...
```

**Response Codes**:
- `00`: Success
- `07`: Suspicious transaction
- `09`: Card not registered for internet banking
- `11`: Payment timeout
- `24`: User cancelled
- `51`: Insufficient balance
- `65`: Daily limit exceeded

### 3. Get Transaction Details

**Endpoint**: `GET /api/v1/payments/transactions/{transactionId}`

**Response**:
```json
{
  "id": "guid",
  "bookingId": "guid",
  "amount": 500000,
  "currency": "VND",
  "gateway": "VNPAY",
  "status": "Success",
  "providerTxnId": "14123456",
  "transactionDate": "2024-12-25T10:30:00Z"
}
```

## 🔒 Security Features

### 1. HMAC-SHA512 Signature

**Signing Process**:
```csharp
// 1. Sort parameters alphabetically
var sortedParams = new SortedDictionary<string, string>
{
    { "vnp_Amount", "50000000" },
    { "vnp_Command", "pay" },
    { "vnp_CreateDate", "20241225103000" },
    // ... other params
};

// 2. Build query string
var queryString = "vnp_Amount=50000000&vnp_Command=pay&...";

// 3. Compute HMAC-SHA512
var hash = HMACSHA512(hashSecret, queryString);

// 4. Append to URL
var url = vnpayUrl + "?" + queryString + "&vnp_SecureHash=" + hash;
```

**Verification** (in callback):
```csharp
// 1. Extract vnp_SecureHash from query
var receivedHash = queryParams["vnp_SecureHash"];

// 2. Remove hash params
queryParams.Remove("vnp_SecureHash");
queryParams.Remove("vnp_SecureHashType");

// 3. Compute hash from remaining params
var computedHash = HMACSHA512(hashSecret, BuildQueryString(queryParams));

// 4. Compare
if (receivedHash != computedHash)
    return "Invalid signature";
```

### 2. Idempotency Protection

**Prevents duplicate payments**:
```csharp
// Check for existing successful transaction
var existingTransaction = await _context.PaymentTransactions
    .FirstOrDefaultAsync(pt => 
        pt.BookingId == bookingId && 
        pt.Status == PaymentStatus.Success
    );

if (existingTransaction != null)
    return "Booking already paid";
```

**Callback idempotency**:
```csharp
// If already processed, return success immediately
if (transaction.Status == PaymentStatus.Success)
{
    return new PaymentCallbackResult(
        transaction.BookingId,
        transaction.Id,
        true,
        "Payment already processed"
    );
}
```

### 3. Transaction Isolation

```csharp
await using var transaction = await _context.Database.BeginTransactionAsync(
    System.Data.IsolationLevel.ReadCommitted,
    cancellationToken
);

try
{
    // Update transaction status
    // Confirm booking
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

## 💰 Payment Amounts

### Deposit Calculation

```csharp
// Default: 30% of total price
var depositAmount = totalPrice * 0.30m;

// Configurable via SystemConfiguration
var depositPercentage = await GetSystemConfig("DepositPercentage"); // e.g., 30
var depositAmount = totalPrice * (depositPercentage / 100m);
```

### Amount Format

**VNPAY requires amount in smallest unit (VND has no decimals)**:
```csharp
// Booking: 500,000 VND
var amount = 500000m;

// VNPAY format: multiply by 100
var vnpayAmount = (long)(amount * 100); // 50000000

// In callback: divide by 100
var actualAmount = decimal.Parse(vnp_Amount) / 100; // 500000
```

## 🔄 Refund Process

### 1. Cancel Booking with Refund

```csharp
// User cancels booking
POST /api/v1/bookings/{id}/cancel
{
  "reason": "Cannot attend"
}

// System checks cancellation policy
var hoursUntilBooking = CalculateHoursUntilBooking(booking);
if (hoursUntilBooking >= minimumCancellationHours)
{
    // Process refund
    await _paymentService.ProcessRefundAsync(
        transactionId,
        depositAmount,
        "User cancellation"
    );
}
```

### 2. Refund Status

```csharp
// Transaction marked as Refunded
transaction.Status = PaymentStatus.Refunded;
transaction.RefundReason = reason;
transaction.RefundedAt = DateTime.UtcNow;
```

**Note**: Current implementation marks as refunded in system. Actual VNPAY refund API call needs to be implemented.

## 🧪 Testing

### Test Cards (VNPAY Sandbox)

**Bank**: NCB (Ngân hàng Quốc Dân)
- Card Number: `9704198526191432198`
- Card Holder: `NGUYEN VAN A`
- Issue Date: `07/15`
- OTP: `123456`

**Bank**: VCB (Vietcombank)
- Card Number: `9704060000000001`
- Card Holder: `NGUYEN VAN A`
- Issue Date: `07/15`
- OTP: `123456`

### Test Scenarios

#### 1. Successful Payment
```bash
# 1. Create booking
POST /api/v1/bookings
{
  "timeSlotId": "...",
  "bookingDate": "2024-12-25"
}
# Response: bookingId

# 2. Create payment
POST /api/v1/payments/create
{
  "bookingId": "...",
  "returnUrl": "http://localhost:3000/payment-result"
}
# Response: paymentUrl

# 3. Open paymentUrl in browser
# 4. Complete payment with test card
# 5. Verify booking status changed to Confirmed
```

#### 2. User Cancels Payment
```bash
# On VNPAY page, click "Hủy giao dịch"
# Expected: 
# - Transaction status: Failed
# - Booking status: Still PendingDeposit
# - User can retry payment
```

#### 3. Duplicate Payment Prevention
```bash
# 1. Complete payment successfully
# 2. Try to create payment again for same booking
POST /api/v1/payments/create
{
  "bookingId": "same-booking-id",
  "returnUrl": "..."
}
# Expected: "Booking already paid"
```

#### 4. Callback Replay Attack
```bash
# 1. Capture callback URL from successful payment
# 2. Replay the same callback
GET /api/v1/payments/callback?vnp_...
# Expected: "Payment already processed" (idempotent)
```

## 📊 Database Schema

### PaymentTransaction Table

```sql
CREATE TABLE PaymentTransactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    BookingId UNIQUEIDENTIFIER NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL,
    Gateway NVARCHAR(50) NOT NULL,
    ProviderTxnId NVARCHAR(200),
    Status NVARCHAR(50) NOT NULL,
    TransactionDate DATETIME2 NOT NULL,
    CompletedAt DATETIME2,
    FailureReason NVARCHAR(500),
    RefundReason NVARCHAR(500),
    RefundedAt DATETIME2,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2,
    IsDeleted BIT NOT NULL DEFAULT 0,
    
    CONSTRAINT FK_PaymentTransactions_Bookings 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id),
    
    INDEX IX_PaymentTransactions_BookingId (BookingId),
    INDEX IX_PaymentTransactions_ProviderTxnId (ProviderTxnId),
    INDEX IX_PaymentTransactions_Status (Status)
);
```

## 🚨 Error Handling

### Common Errors

1. **"Booking not found"**
   - Invalid booking ID
   - Booking deleted

2. **"Booking is not in pending deposit status"**
   - Already paid
   - Already cancelled
   - Already completed

3. **"Booking already paid"**
   - Duplicate payment attempt
   - Check transaction history

4. **"Invalid payment signature"**
   - Tampered callback URL
   - Wrong hash secret
   - Security issue - log and investigate

5. **"Transaction not found"**
   - Invalid transaction reference
   - Possible attack attempt

### Error Logging

```csharp
_logger.LogError(
    "Payment callback signature mismatch. " +
    "Expected: {Expected}, Received: {Received}, " +
    "TxnRef: {TxnRef}",
    computedHash,
    receivedHash,
    txnRef
);
```

## 📈 Monitoring & Analytics

### Metrics to Track

1. **Payment Success Rate**
   ```sql
   SELECT 
       COUNT(CASE WHEN Status = 'Success' THEN 1 END) * 100.0 / COUNT(*) as SuccessRate
   FROM PaymentTransactions
   WHERE TransactionDate >= DATEADD(day, -7, GETDATE());
   ```

2. **Average Payment Time**
   ```sql
   SELECT 
       AVG(DATEDIFF(second, TransactionDate, CompletedAt)) as AvgSeconds
   FROM PaymentTransactions
   WHERE Status = 'Success';
   ```

3. **Failed Payment Reasons**
   ```sql
   SELECT 
       FailureReason,
       COUNT(*) as Count
   FROM PaymentTransactions
   WHERE Status = 'Failed'
   GROUP BY FailureReason
   ORDER BY Count DESC;
   ```

4. **Refund Rate**
   ```sql
   SELECT 
       COUNT(CASE WHEN Status = 'Refunded' THEN 1 END) * 100.0 / 
       COUNT(CASE WHEN Status = 'Success' THEN 1 END) as RefundRate
   FROM PaymentTransactions;
   ```

## 🔧 Configuration Options

### System Configuration

```csharp
// Deposit percentage (default: 30%)
await SetSystemConfig("DepositPercentage", "30");

// Payment timeout (minutes)
await SetSystemConfig("PaymentTimeoutMinutes", "15");

// Minimum cancellation hours for refund
await SetSystemConfig("MinimumCancellationHours", "24");
```

## 🚀 Production Checklist

- [ ] Update VNPAY credentials to production
- [ ] Configure production return URL
- [ ] Enable HTTPS only
- [ ] Set up payment monitoring
- [ ] Configure email notifications
- [ ] Test refund process
- [ ] Set up webhook retry mechanism
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Set up alerting for failed payments
- [ ] Document payment reconciliation process
- [ ] Test disaster recovery

## 📚 VNPAY Documentation

- Sandbox: https://sandbox.vnpayment.vn/apis/docs/
- Production: https://vnpay.vn/
- Support: support@vnpay.vn

## 🎯 Future Enhancements

1. **Multiple Payment Gateways**
   - MoMo integration
   - ZaloPay integration
   - Gateway selection by user

2. **Installment Payments**
   - Split payment into multiple installments
   - Recurring payments for memberships

3. **Wallet System**
   - User wallet for faster checkout
   - Wallet top-up
   - Cashback rewards

4. **Payment Analytics Dashboard**
   - Real-time payment monitoring
   - Revenue charts
   - Conversion funnel

5. **Automated Reconciliation**
   - Daily payment reconciliation
   - Mismatch detection
   - Auto-retry failed callbacks
