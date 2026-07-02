# Hướng Dẫn Kiểm Tra Chức Năng Lọc Theo Ngày - Trang Đánh Giá Owner

## 📋 Tổng Quan Thay Đổi

Chức năng lọc theo ngày trên trang đánh giá của owner dashboard đã được cải tiến:

### ✅ Frontend Changes (React/TypeScript)
- **File**: `client/src/features/owner/pages/Reviews.tsx`
- **Cải tiến**:
  1. ✨ Logic lọc ngày được cải thiện - dùng Date objects thay vì string comparison
  2. 🎨 UI indicator rõ ràng khi date filter được áp dụng (background blue)
  3. 🔄 Tự động fetch lại data từ backend khi date thay đổi
  4. ⚡ Performance tốt hơn vì backend xử lý filtering

### ✅ Backend Changes (.NET/C#)
- **Files**:
  - `server/Application/Features/Reviews/Queries/GetOwnerReviews/GetOwnerReviewsQuery.cs`
  - `server/Application/Features/Reviews/Queries/GetOwnerReviews/GetOwnerReviewsQueryHandler.cs`
  - `server/Api/Controllers/ReviewsController.cs`

- **Cải tiến**:
  1. 📅 Query handler giờ hỗ trợ `FromDate` và `ToDate` parameters
  2. 🔍 Database filtering thay vì client-side filtering
  3. 📦 API endpoint giờ nhận query parameters: `?fromDate=...&toDate=...`
  4. ✅ Xử lý edge case cho ngày cuối (bao gồm toàn bộ ngày)

## 🧪 Bước Kiểm Tra

### 1. Dừng API Server Hiện Tại
```powershell
# Tìm process Api và dừng nó
Get-Process dotnet | Stop-Process -Force
```

### 2. Build Solution
```powershell
cd server
dotnet build SportsPitchBooking.sln -c Debug
```

### 3. Chạy API Server
```powershell
cd server/Api
dotnet run
```

### 4. Chạy Frontend
```powershell
cd client
npm run dev
```

### 5. Test Cases

#### Test Case 1: Lọc Theo Ngày Bắt Đầu
- Đăng nhập với tài khoản owner
- Chuyển đến `/dashboard/owner/reviews`
- Chọn ngày bắt đầu: `01/01/2024`
- **Kỳ vọng**: Chỉ hiển thị đánh giá từ ngày 01/01/2024 trở đi
- **Xác nhận**: Date picker có background xanh, số đánh giá giảm

#### Test Case 2: Lọc Theo Ngày Kết Thúc
- Chọn ngày kết thúc: `15/01/2024`
- **Kỳ vọng**: Chỉ hiển thị đánh giá từ ngày 01/01/2024 đến 15/01/2024 (inclusive)
- **Xác nhận**: Tất cả ngày hiển thị <= 15/01/2024

#### Test Case 3: Xóa Date Filter
- Nhấn nút "Xóa lọc" (Clear Filters button)
- **Kỳ vọng**: Date picker reset về trống, toàn bộ đánh giá được hiển thị

#### Test Case 4: Kết Hợp Bộ Lọc
- Chọn ngày: 01/01/2024 - 15/01/2024
- Chọn sân cụ thể
- Chọn rating: 5 sao
- Trạng thái: Chưa phản hồi
- **Kỳ vọng**: Lọc theo TẤT CẢ điều kiện, kết quả chính xác

#### Test Case 5: Edge Cases
- Chọn ngày cuối = ngày bắt đầu (vd: 05/01/2024 - 05/01/2024)
- **Kỳ vọng**: Chỉ hiển thị đánh giá ngày 05/01/2024

- Chọn ngày khoảng rỗng (no reviews in range)
- **Kỳ vọng**: Hiển thị "Chưa có đánh giá phù hợp"

## 🔍 Network Inspection

### Kiểm Tra Request Format
1. Mở DevTools (F12)
2. Chuyển sang Network tab
3. Chọn date filter
4. Tìm request `/owner/reviews`
5. **Kỳ vọng Query Parameters**:
   ```
   fromDate: 2024-01-01T00:00:00.000Z
   toDate: 2024-01-16T00:00:00.000Z  (Note: +1 day)
   ```

### Kiểm Tra Response
- Response JSON phải chỉ chứa reviews trong date range
- Mỗi review có `createdAt` field

## 📊 Performance Verification

### Trước Cải Tiến (Client-side Filter)
- Fetch tất cả reviews (có thể hàng ngàn)
- Filter ở browser (có thể chậm)

### Sau Cải Tiến (Server-side Filter)
- Backend chỉ return reviews trong date range
- Giảm data transfer
- Hiệu suất tốt hơn khi có nhiều reviews

## 🐛 Troubleshooting

### Problem: Date picker không hiển thị
**Solution**: Xóa cache browser, rebuild frontend
```bash
npm run build
```

### Problem: Lọc không hoạt động
**Solution**: 
1. Kiểm tra DevTools Network tab xem request có đúng params không
2. Kiểm tra backend logs xem có error không
3. Xác minh CreatedAt format ở database

### Problem: Kết quả lọc sai
**Solution**:
1. Kiểm tra timezone - database có thể dùng UTC
2. Xác minh backend handler cộng +1 ngày cho toDate để inclusive

## 📝 Notes

- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Backend Handling**: `r.CreatedAt.Date >= fromDate.Date` và `r.CreatedAt < toDate.AddDays(1)`
- **Client-side**: Chỉ lọc text search, pitch, rating, reply status (ngày tháng đã xử lý backend)

## 🎯 Acceptance Criteria

✅ Date filter hoạt động chính xác  
✅ Edge cases được xử lý (ngày cuối inclusive)  
✅ UI feedback rõ ràng khi filter được áp dụng  
✅ Performance tốt với large datasets  
✅ Kết hợp với các bộ lọc khác hoạt động đúng  
