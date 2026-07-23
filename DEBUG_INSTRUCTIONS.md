# Hướng dẫn Debug lỗi 405

## Bước 1: Mở Chrome DevTools
1. Nhấn `F12` hoặc `Ctrl+Shift+I`
2. Chuyển sang tab **Console**

## Bước 2: Thử đặt sân lại
1. Chọn 1 hoặc nhiều khung giờ
2. Click "Đặt sân ngay"
3. Điền thông tin
4. Click "Xác nhận và thanh toán"

## Bước 3: Xem logs trong Console
Sẽ thấy các dòng log như:
```
[Booking] Creating booking: { isMultiSlot: true/false, slotCount: 1/2/3... }
[Booking] Locking X slots...
[Booking] Creating multi-slot booking via /bookings/multi-slot
[Booking] Request payload: {...}
```

**Nếu thấy lỗi:**
```
[Booking] Error: Request failed with status code 405
```

## Bước 4: Chuyển sang tab Network
1. Click tab **Network** trong DevTools
2. Thử lại bước đặt sân
3. Tìm request màu đỏ (failed)
4. Click vào request đó

## Bước 5: Kiểm tra chi tiết request
### Request URL
- Đúng: `http://localhost:5164/api/v1/bookings/multi-slot`
- Hoặc: `http://localhost:5164/api/v1/bookings`

### Request Method
- Phải là: **POST**

### Request Headers
- Phải có: `Authorization: Bearer ...`
- Phải có: `Content-Type: application/json`

### Request Payload (tab Payload)
Cho 1 slot:
```json
{
  "timeSlotId": "guid-here",
  "bookingDate": "2024-12-25",
  "selectedServices": []
}
```

Cho nhiều slots:
```json
{
  "timeSlots": [
    {
      "timeSlotId": "guid-1",
      "bookingDate": "2024-12-25"
    },
    {
      "timeSlotId": "guid-2",
      "bookingDate": "2024-12-25"
    }
  ],
  "selectedServices": []
}
```

### Response
- Status: **405 Method Not Allowed**
- Body: Có thể chứa thông tin lỗi

## Các trường hợp thường gặp

### Case 1: Request URL sai
❌ `/booking/multi-slot` (thiếu 's')
✅ `/bookings/multi-slot`

**Fix**: Không cần fix, code đã đúng

### Case 2: Request Method sai
❌ GET, PUT, DELETE
✅ POST

**Fix**: Không cần fix, code dùng `api.post()`

### Case 3: Backend chưa compile code mới
Nếu bạn vừa thêm endpoint mới mà chưa restart backend

**Fix**:
```bash
# Stop backend (Ctrl+C)
# Rebuild
dotnet build
# Run lại
dotnet run --project server/Api
```

### Case 4: Token hết hạn
**Kiểm tra**: 
1. Mở Console
2. Gõ: `localStorage.getItem('token')`
3. Nếu thấy token → Copy
4. Vào https://jwt.io/
5. Paste token → Check "exp" (expiration)

**Fix**: Đăng xuất và đăng nhập lại

### Case 5: API URL không đúng
**Kiểm tra**:
1. Mở file `.env` trong thư mục `client`
2. Check dòng `VITE_API_URL`

**Fix**:
```env
# Development
VITE_API_URL=http://localhost:5164/api/v1

# Production
VITE_API_URL=https://smartsport-api.onrender.com/api/v1
```

Sau khi sửa, restart dev server:
```bash
# Ctrl+C để stop
# npm run dev để start lại
```

## Test nhanh

### Test 1: Backend có chạy không?
Mở trình duyệt, vào:
```
http://localhost:5164/api/v1/bookings
```

Nếu thấy:
- `401 Unauthorized` → ✅ Backend chạy, chỉ cần login
- `404 Not Found` → ❌ Backend không chạy hoặc URL sai
- `405 Method Not Allowed` → ✅ Backend chạy (vì endpoint chỉ chấp nhận POST, không chấp nhận GET)

### Test 2: Thử đặt 1 slot (single-slot)
1. Chọn **CHỈ 1** khung giờ
2. Đặt sân
3. Nếu OK → Multi-slot endpoint có vấn đề
4. Nếu cũng lỗi 405 → Single-slot endpoint có vấn đề

## Copy thông tin để report
Nếu vẫn lỗi, copy những thông tin sau:

1. **Console logs** (toàn bộ output từ Console tab)
2. **Request URL** (từ Network tab)
3. **Request Method** (từ Network tab)
4. **Request Payload** (từ Network tab → Payload)
5. **Response Status & Body** (từ Network tab → Response)
6. **VITE_API_URL** (từ file .env)
7. **Số khung giờ đã chọn** (1 hay nhiều?)

Paste vào một file text và gửi để được hỗ trợ!

## Temporary Workaround
Nếu muốn test tạm:
1. **Chỉ chọn 1 khung giờ** mỗi lần
2. Đặt nhiều lần nếu muốn nhiều giờ
3. Feature đặt nhiều giờ sẽ được fix sau

Lưu ý: Cách này bạn phải thanh toán nhiều lần!
