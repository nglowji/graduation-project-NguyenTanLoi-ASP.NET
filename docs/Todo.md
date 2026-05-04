# 📋 TODO - SmartSport Platform

> Bản kế hoạch nâng cấp toàn diện cho Đồ án Tốt nghiệp (Cập nhật: 2026-05-04)

## ✅ ĐÃ HOÀN THÀNH
- ✅ **Clean Architecture & CQRS**: Cấu trúc 4 lớp chuẩn chỉnh.
- ✅ **Core Booking**: Hệ thống đặt sân cơ bản.
- ✅ **Concurrency Control**: Chống double booking bằng `BookingLock` & Optimistic Locking.
- ✅ **Payment**: Tích hợp VNPAY thành công.
- ✅ **AI Chat & Recs**: Tích hợp Gemini tư vấn và gợi ý sân (v1).
- ✅ **Testing Infrastructure**: Khởi tạo dự án Unit Test (xUnit, Moq, FluentAssertions).

---

## 🚀 LỘ TRÌNH THỰC HIỆN TIẾP THEO

### 1. Tính năng Thông minh & Kinh doanh (Business Logic)
- [x] **A. Gợi ý sân thông minh (Personalized Recommendation)**
    - [x] Phân tích lịch sử: Vị trí, thời gian hay chơi, loại sân yêu thích.
    - [x] Logic: "Bạn thường chơi cầu lông tối thứ 7 → gợi ý sân trống phù hợp".
- [x] **B. Dynamic Pricing (Giá linh hoạt)**
    - [x] Peak hours: +30% (17h-21h).
    - [x] Off-peak hours: -20% (sau 22h).
    - [x] Weekend pricing logic (+10%).
- [x] **C. Waitlist (Danh sách chờ)**
    - [x] Cho phép user vào hàng đợi khi sân full.
    - [x] Tự động thông báo qua hệ thống khi có người hủy booking (FIFO).
- [x] **D. Booking Deposit (Đặt cọc)**
    - [x] Logic thanh toán trước một phần (mặc định 30%, có thể cấu hình).
    - [x] Chính sách hoàn cọc linh hoạt: Tự động hoàn tiền qua VNPAY nếu hủy trước 24h (có thể cấu hình).

### 2. Kỹ thuật Xuất sắc (Technical Excellence) ⭐ ĐIỂM CỘNG CV
- [x] **F. Real-time Status (SignalR)**
    - [x] Cập nhật trạng thái sân ngay lập tức trên UI khi có người đặt/hủy/khóa sân.
    - [x] Tối ưu hóa với SignalR Groups theo PitchId.
- [x] **G. Notification System**
    - [x] Tích hợp Email (SMTP) thông báo khi đặt sân thành công.
    - [ ] Push Notification (Optional).
- [x] **H. QR Check-in**
    - [x] Generate QR code sau khi booking thành công.
    - [x] Tích hợp mã QR vào Email xác nhận.
    - [ ] API cho chủ sân scan xác nhận khách đến (Check-in).

### 3. Tính năng "Wow" & Social
- [ ] **I. Match-making (Tìm đồng đội)**
    - [ ] Đăng bài tìm người chơi/đối thủ.
    - [ ] Ghép kèo tự động dựa trên trình độ/vị trí.
- [x] **J. Rating & Review System**
    - [x] Đánh giá chất lượng sân, dịch vụ, ánh sáng.
    - [x] Hiển thị đánh giá của người dùng.
- [ ] **K. AI Chatbot Pro**
    - [ ] Nâng cấp chatbot để hỗ trợ đặt sân trực tiếp qua hội thoại.

---

## 🛠️ CÁC CÔNG VIỆC NỀN TẢNG CẦN LÀM NGAY
- [x] **Testing Coverage**: Viết Unit Test cho Domain & Application (Logic giá & Đặt cọc).
- [x] **Owner & Admin Dashboard**: Các API quản lý và thống kê doanh thu dành cho chủ sân.
- [x] **Performance**: Tích hợp Redis Caching cho Pitch & TimeSlot availability.

---

## 🎯 ĐIỂM NHẤN TRONG CV
1. **Architecture**: Clean Architecture + DDD + CQRS.
2. **Real-time**: SignalR cho trải nghiệm mượt mà.
3. **Intelligence**: AI Chatbot & Recommendation engine.
4. **Reliability**: Concurrency control & High test coverage.
5. **Business**: Dynamic pricing & Deposit logic.
