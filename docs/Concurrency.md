# Concurrency & Race Condition Solutions

## 🎯 Vấn đề đã giải quyết

### 1. **Double Booking Prevention**
**Vấn đề**: 2 users đặt cùng 1 khung giờ cùng lúc

**Giải pháp**:
- **BookingLock Entity**: Temporary lock trước khi booking
- **Serializable Isolation Level**: Đảm bảo transaction không conflict
- **Lock-then-Book Flow**: User phải lock trước, sau đó mới book

**Flow**:
```
1. User A: Lock time slot → Success (Lock ID: abc-123)
2. User B: Lock time slot → Failure (already locked by User A)
3. User A: Create booking → Success (lock released automatically)
4. User B: Retry after lock expires (10 minutes default)
```

### 2. **Payment Idempotency**
**Vấn đề**: User click thanh toán nhiều lần

**Giải pháp**:
- **Idempotency Key**: Mỗi payment request có unique key
- **Transaction Status Check**: Kiểm tra existing transaction trước khi tạo mới
- **Database Constraints**: Unique constraint trên (BookingId, Status)

### 3. **Stale Data Protection**
**Vấn đề**: Kiểm tra availability nhưng đã bị đặt khi save

**Giải pháp**:
- **Execution Strategy**: Retry logic cho transient failures
- **Double-Check Pattern**: Verify availability trong transaction
- **Optimistic Concurrency**: EF Core concurrency tokens

## 📋 Booking Flow với Lock

### Step 1: Lock Time Slot
```http
POST /api/v1/bookings/lock
Authorization: Bearer {token}
Content-Type: application/json

{
  "timeSlotId": "guid",
  "bookingDate": "2024-12-25",
  "lockDurationMinutes": 10
}

Response:
{
  "lockId": "guid",
  "message": "Time slot locked successfully"
}
```

### Step 2: Create Booking (within lock duration)
```http
POST /api/v1/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "timeSlotId": "guid",
  "bookingDate": "2024-12-25"
}

Response:
{
  "bookingId": "guid"
}
```

### Step 3: Release Lock (optional - auto-released after booking)
```http
POST /api/v1/bookings/release-lock/{lockId}
Authorization: Bearer {token}

Response: 204 No Content
```

## 🔒 Lock Mechanism

### BookingLock Entity
```csharp
- TimeSlotId: Guid
- BookingDate: DateOnly
- UserId: Guid
- LockedAt: DateTime
- ExpiresAt: DateTime (default: LockedAt + 10 minutes)
- IsReleased: bool
```

### Lock States
1. **Active**: `!IsReleased && ExpiresAt > Now`
2. **Expired**: `!IsReleased && ExpiresAt <= Now`
3. **Released**: `IsReleased == true`

### Lock Rules
- ✅ User can extend their own lock
- ✅ Lock auto-expires after duration
- ✅ Lock auto-released after successful booking
- ✅ Only one active lock per (TimeSlot, Date)
- ✅ Background service cleans up expired locks every 5 minutes

## 🛡️ Database Isolation Levels

### Serializable Isolation
```csharp
await using var transaction = await _context.Database.BeginTransactionAsync(
    System.Data.IsolationLevel.Serializable,
    cancellationToken
);
```

**Prevents**:
- Dirty reads
- Non-repeatable reads
- Phantom reads
- Lost updates

**Trade-off**: Slightly slower but ensures data consistency

## 🔄 Retry Strategy

### Execution Strategy
```csharp
var strategy = _context.Database.CreateExecutionStrategy();

return await strategy.ExecuteAsync(async () =>
{
    // Transaction logic here
});
```

**Handles**:
- Transient database failures
- Deadlocks
- Connection timeouts

## 📊 Performance Considerations

### Indexes
```sql
-- Composite index for fast lock lookup
CREATE INDEX IX_BookingLocks_TimeSlot_Date_Status 
ON BookingLocks (TimeSlotId, BookingDate, IsReleased, ExpiresAt);

-- Index for user locks
CREATE INDEX IX_BookingLocks_UserId 
ON BookingLocks (UserId);

-- Index for cleanup
CREATE INDEX IX_BookingLocks_ExpiresAt 
ON BookingLocks (ExpiresAt);
```

### Lock Duration Tuning
- **Default**: 10 minutes (balance between UX and availability)
- **Minimum**: 5 minutes (enough time for payment)
- **Maximum**: 15 minutes (prevent long-term blocking)

## 🧪 Testing Scenarios

### Test 1: Concurrent Lock Attempts
```csharp
// User A and User B try to lock same slot simultaneously
Task<Result> lockA = LockTimeSlot(userA, timeSlotId, date);
Task<Result> lockB = LockTimeSlot(userB, timeSlotId, date);

await Task.WhenAll(lockA, lockB);

// Expected: One succeeds, one fails
Assert.True(lockA.Result.IsSuccess ^ lockB.Result.IsSuccess);
```

### Test 2: Lock Expiration
```csharp
// Lock with 1 minute duration
var lockResult = await LockTimeSlot(userId, timeSlotId, date, 1);

// Wait 2 minutes
await Task.Delay(TimeSpan.FromMinutes(2));

// Another user should be able to lock
var lockResult2 = await LockTimeSlot(userId2, timeSlotId, date);
Assert.True(lockResult2.IsSuccess);
```

### Test 3: Booking Without Lock
```csharp
// Try to book without locking first
var bookingResult = await CreateBooking(userId, timeSlotId, date);

// Expected: Failure
Assert.False(bookingResult.IsSuccess);
Assert.Contains("No active lock found", bookingResult.ErrorMessage);
```

## 🚨 Error Handling

### Common Errors

1. **"Time slot is currently being booked by another user"**
   - Another user has active lock
   - Wait for lock to expire (check ExpiresAt)

2. **"No active lock found"**
   - Lock expired before booking
   - Need to lock again

3. **"Time slot is no longer available"**
   - Someone else booked while you had lock
   - Race condition detected and prevented

4. **"Failed to lock time slot"**
   - Database transaction conflict
   - Retry with exponential backoff

## 📈 Monitoring

### Metrics to Track
- Lock acquisition success rate
- Average lock duration
- Lock expiration rate (should be low)
- Concurrent lock attempts
- Booking success rate after lock

### Logs
```
[INFO] Lock {LockId} created for time slot {TimeSlotId} by user {UserId}
[INFO] Extended lock {LockId} for user {UserId}
[INFO] Lock {LockId} released by user {UserId}
[INFO] Cleaned up {Count} expired booking locks
[ERROR] Error creating booking lock
```

## 🔧 Configuration

### appsettings.json
```json
{
  "BookingLock": {
    "DefaultDurationMinutes": 10,
    "MaxDurationMinutes": 15,
    "CleanupIntervalMinutes": 5
  }
}
```

## 🎯 Best Practices

1. **Always lock before booking**
2. **Handle lock expiration gracefully**
3. **Release locks when user cancels**
4. **Monitor lock metrics**
5. **Tune lock duration based on payment flow**
6. **Use background service for cleanup**
7. **Log all lock operations**
8. **Test concurrent scenarios**

## 🚀 Future Enhancements

1. **Distributed Locks**: Redis for multi-instance deployments
2. **Lock Queue**: Queue system for high-demand time slots
3. **Priority Locks**: VIP users get priority
4. **Lock Notifications**: Notify when lock about to expire
5. **Lock Analytics**: Dashboard for lock statistics
