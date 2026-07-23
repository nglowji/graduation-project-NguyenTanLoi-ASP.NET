# Cập nhật: Đặt nhiều khung giờ cùng lúc

## Tổng quan
Hệ thống đã được cập nhật để cho phép người dùng đặt nhiều khung giờ cùng lúc (tối đa 10 khung giờ).

## Thay đổi Backend (ASP.NET Core)

### 1. Command & Handler mới
**Files:**
- `Application/Features/Bookings/Commands/CreateMultiSlotBooking/CreateMultiSlotBookingCommand.cs`
- `Application/Features/Bookings/Commands/CreateMultiSlotBooking/CreateMultiSlotBookingCommandHandler.cs`
- `Application/Features/Bookings/Commands/CreateMultiSlotBooking/CreateMultiSlotBookingCommandValidator.cs`

**Chức năng:**
- Nhận danh sách các khung giờ (BookingSlotRequest[])
- Kiểm tra lock cho TẤT CẢ các khung giờ
- Validate availability cho từng khung giờ
- Tạo nhiều bookings atomically (trong 1 transaction)
- Release tất cả locks nếu có lỗi
- Gửi email xác nhận multi-slot booking
- Publish events cho real-time updates

### 2. API Controller
**File:** `Api/Controllers/BookingsController.cs`

**Endpoint mới:**
```csharp
POST /api/v1/bookings/multi-slot
```

**Request body:**
```json
{
  "timeSlots": [
    {
      "timeSlotId": "guid",
      "bookingDate": "2024-12-25"
    },
    {
      "timeSlotId": "guid",
      "bookingDate": "2024-12-25"
    }
  ],
  "selectedServices": [
    {
      "serviceId": "guid",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã tạo thành công 3 đặt sân",
  "data": ["bookingId1", "bookingId2", "bookingId3"]
}
```

### 3. Repository Updates
**File:** `Infrastructure/Repositories/TimeSlotRepository.cs`

**Method mới:**
```csharp
Task<IReadOnlyList<TimeSlot>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken)
```

### 4. Email Service
**File:** `Infrastructure/Services/SmtpEmailService.cs`

**Method mới:**
```csharp
Task SendMultiSlotBookingConfirmationAsync(
    string email, 
    string userName, 
    string pitchName, 
    int slotCount, 
    DateOnly bookingDate,
    CancellationToken cancellationToken)
```

### 5. Contracts
**File:** `Api/Contracts/ApiContracts.cs`

**New records:**
```csharp
public record BookingSlotRequestDto(Guid TimeSlotId, DateOnly BookingDate);

public record CreateMultiSlotBookingRequest(
    List<BookingSlotRequestDto> TimeSlots,
    List<BookingServiceRequest>? SelectedServices = null
);
```

## Thay đổi Frontend (React/TypeScript)

### 1. FieldDetails.tsx
**Đã hỗ trợ multi-select từ trước:**
- State `selectedSlots` là array
- Người dùng có thể click nhiều khung giờ
- Tính tổng giá tự động
- Lưu tất cả slot IDs vào sessionStorage:

```typescript
sessionStorage.setItem('bookingDraft', JSON.stringify({
  timeSlotId: firstSlot.id, // For backward compatibility
  timeSlotIds: sortedSlots.map((slot) => slot.id), // NEW: Array of all selected slots
  bookingDate: selectedDate,
  preview: {
    selectedSlots: sortedSlots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: Number(slot.price ?? pitch?.minPrice ?? 0),
    })),
    totalPrice: selectedTotal
  }
}));
```

### 2. BookingReview.tsx
**Cập nhật logic payment:**

```typescript
const handlePayment = async (provider?: PaymentProvider) => {
  // ...
  if (isDraft) {
    const timeSlotIds = draft.timeSlotIds || [draft.timeSlotId];
    const isMultiSlot = timeSlotIds.length > 1;

    if (isMultiSlot) {
      // Lock all slots
      for (const slotId of timeSlotIds) {
        const lock = await bookingService.lock(slotId, draft.bookingDate);
        lockIds.push(lock.lockId);
      }

      // Create multi-slot booking
      const bookingResponse = await api.post('/bookings/multi-slot', {
        timeSlots: timeSlotIds.map((slotId) => ({
          timeSlotId: slotId,
          bookingDate: draft.bookingDate,
        })),
        selectedServices: // ...
      });

      // Use first booking ID for payment
      const bookingIds = bookingResponse.data || [];
      confirmedBooking = await bookingService.getById(bookingIds[0]);
    } else {
      // Original single-slot logic
      // ...
    }
  }
  // Continue with payment...
};
```

## Validation & Business Rules

### Backend Validation
1. **Giới hạn số lượng:** Tối đa 10 khung giờ/lần đặt
2. **Lock verification:** Phải có lock cho TẤT CẢ slots
3. **Availability check:** Double-check availability trước khi tạo
4. **Atomicity:** Tất cả bookings được tạo trong 1 transaction
5. **Error handling:** Release tất cả locks nếu có bất kỳ lỗi nào

### Frontend UX
1. User select nhiều khung giờ trên timeline
2. Hiển thị tổng giá real-time
3. Hiển thị số lượng khung giờ đã chọn
4. Lock tuần tự từng khung giờ (tránh race condition)
5. Thông báo chi tiết nếu có slot nào unavailable

## Flow hoàn chỉnh

### 1. Chọn sân (FieldDetails)
```
User → Click nhiều khung giờ
     → UI cập nhật selectedSlots[]
     → Tính tổng giá auto
     → Click "Đặt sân"
     → Lưu timeSlotIds[] vào sessionStorage
     → Navigate to /booking-review/new
```

### 2. Xác nhận & thanh toán (BookingReview)
```
User → Xác nhận thông tin
     → Click "Thanh toán"
     → Lock tất cả slots tuần tự
     → Call POST /bookings/multi-slot
     → Backend tạo nhiều bookings
     → Frontend nhận bookingIds[]
     → Lấy thông tin booking đầu tiên
     → Redirect to payment gateway
```

### 3. Backend xử lý (CreateMultiSlotBookingHandler)
```
1. Validate input (1-10 slots)
2. Load all time slots
3. Check locks for all slots
4. Double-check availability
5. Create all bookings in transaction
6. Release all locks
7. Save changes
8. Send confirmation email
9. Publish events
10. Return booking IDs
```

## Error Handling

### Frontend
- Hiển thị lỗi rõ ràng cho từng slot unavailable
- Auto-release locks khi có lỗi
- Rollback UI state nếu cần

### Backend
- Transaction rollback nếu bất kỳ booking nào fail
- Release tất cả locks trong finally block
- Log chi tiết cho debugging
- Friendly error messages cho user

## Testing Checklist

- [ ] Đặt 1 slot (backward compatibility)
- [ ] Đặt 2-5 slots cùng lúc
- [ ] Đặt 10 slots (max)
- [ ] Thử đặt >10 slots (should fail)
- [ ] Race condition: 2 users đặt cùng slot
- [ ] Lock timeout scenario
- [ ] Payment success flow
- [ ] Payment failure flow
- [ ] Email notification
- [ ] Real-time updates via SignalR

## Migration Notes

### Backward Compatibility
- Single-slot booking vẫn hoạt động bình thường
- Endpoint cũ `/bookings` vẫn available
- Frontend tự động detect single vs multi-slot

### Database
- KHÔNG cần migration
- Booking entity không thay đổi
- Mỗi slot = 1 booking record riêng

### Deployment
1. Deploy backend trước (API mới)
2. Deploy frontend sau (sử dụng API mới)
3. Monitor logs trong 24h đầu

## Performance Considerations

### Optimizations
1. Batch load time slots (GetByIdsAsync)
2. Parallel availability checks where safe
3. Single database transaction for all bookings
4. Async email sending (non-blocking)

### Potential Issues
- Lock contention khi nhiều users đặt cùng lúc
- Transaction timeout nếu đặt quá nhiều slots
- Email queue backlog nếu traffic cao

### Recommendations
- Consider queue-based booking for high traffic
- Implement rate limiting per user
- Add caching for time slot availability
- Monitor database connection pool

## Future Enhancements

1. **Group bookings:** Link related bookings với group ID
2. **Bulk discount:** Giảm giá khi đặt nhiều slots
3. **Smart scheduling:** Suggest optimal slot combinations
4. **Payment split:** Cho phép thanh toán từng phần
5. **Recurring bookings:** Đặt lặp lại hàng tuần
