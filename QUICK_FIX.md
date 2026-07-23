# Quick Fix: Lỗi 405 khi đặt sân

## Nguyên nhân có thể:
Backend chưa restart sau khi thêm code mới cho multi-slot booking

## Cách sửa nhanh:

### Bước 1: Stop Backend
Nếu backend đang chạy:
- Nhấn `Ctrl + C` trong terminal đang chạy backend
- Hoặc đóng terminal

### Bước 2: Rebuild Backend
Mở terminal mới tại thư mục root project:

```bash
cd server
dotnet build
```

### Bước 3: Start Backend lại
```bash
cd Api
dotnet run
```

Hoặc từ root:
```bash
dotnet run --project server/Api/Api.csproj
```

### Bước 4: Test lại
1. Mở app: http://localhost:5173
2. Chọn sân
3. Chọn khung giờ
4. Đặt sân
5. Xác nhận và thanh toán

## Nếu vẫn lỗi:

### Option A: Test với file HTML
1. Mở file: `client/test-booking-api.html` trong trình duyệt
2. Đăng nhập vào app chính
3. Lấy token từ localStorage
4. Paste vào form test
5. Nhập Time Slot ID (có thể lấy từ Network tab khi xem sân)
6. Click "Test Multi Slot Booking"
7. Xem kết quả

### Option B: Test với PowerShell
```powershell
cd d:\graduation-project-NguyenTanLoi-ASP.NET
.\test-endpoints.ps1 -Token "your-token-here" -TimeSlotId "some-guid"
```

### Option C: Kiểm tra logs
Xem terminal backend có error không:
- `System.InvalidOperationException`
- `No handler found`
- `Route conflict`
- v.v.

## Kiểm tra nhanh Backend đang chạy:

Mở trình duyệt, vào: http://localhost:5164/api/v1/bookings

- Nếu thấy `401 Unauthorized` → ✅ Đang chạy
- Nếu thấy `405 Method Not Allowed` → ✅ Đang chạy
- Nếu thấy `Connection refused` → ❌ Không chạy

## Kiểm tra Frontend đang chạy:

Mở: http://localhost:5173

- Nếu load được → ✅ Đang chạy
- Nếu không → Chạy: `npm run dev` trong thư mục `client`

## Thông tin cần để debug:

Nếu vẫn không được, cung cấp:

1. **Console logs** (F12 → Console)
   - Copy tất cả logs bắt đầu bằng `[Booking]`

2. **Network request** (F12 → Network → Click vào request lỗi)
   - URL
   - Method
   - Request Payload
   - Response Status
   - Response Body

3. **Backend logs** (từ terminal đang chạy backend)
   - Copy 50 dòng cuối

4. **.env file** (client/.env)
   ```
   VITE_API_URL=?
   ```

5. **Số khung giờ đã chọn**
   - 1 slot hay nhiều slots?

## Workaround tạm thời:

Nếu multi-slot không hoạt động:
1. Chỉ chọn **1 khung giờ** mỗi lần
2. Đặt và thanh toán
3. Lặp lại nếu muốn nhiều giờ

Lưu ý: Cách này phải thanh toán nhiều lần!
