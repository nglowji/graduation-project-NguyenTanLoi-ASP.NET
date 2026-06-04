# 1. Chức năng Người dùng (Customer/User)

## 1.1 Xác thực tài khoản

* Đăng ký tài khoản
* Đăng nhập
* Đăng nhập Google OAuth
* Đăng xuất
* Quên mật khẩu qua email
* Đổi mật khẩu
* JWT Authentication
* Refresh token
* Xác minh email
* Khóa/mở tài khoản

---

## 1.2 Quản lý hồ sơ cá nhân

* Xem thông tin cá nhân
* Cập nhật thông tin cá nhân
* Cập nhật avatar
* Cập nhật địa chỉ
* Lưu vị trí thường dùng
* Quản lý preference/sở thích
* Xem lịch sử đăng nhập

---

## 1.3 Tìm kiếm sân thể thao

* Tìm sân theo:

  * tên sân
  * loại sân
  * địa điểm
  * quận/huyện
  * thành phố
* Tìm sân gần vị trí hiện tại
* Tìm sân theo Google Maps
* Lọc theo:

  * giá
  * khoảng cách
  * rating
  * sân trong nhà/ngoài trời
  * khung giờ
* Sắp xếp:

  * gần nhất
  * giá thấp nhất
  * rating cao nhất
  * phổ biến nhất

---

## 1.4 Google Maps Integration

* Hiển thị sân trên bản đồ
* Lấy vị trí người dùng
* Tính khoảng cách đến sân
* Gợi ý sân gần nhất
* Chỉ đường Google Maps
* Geocoding địa chỉ
* Reverse Geocoding
* Hiển thị marker sân
* Hiển thị thông tin sân trên map

---

## 1.5 Xem thông tin sân

* Xem chi tiết sân
* Xem hình ảnh sân
* Xem mô tả sân
* Xem bảng giá
* Xem khung giờ hoạt động
* Xem rating/review
* Xem tiện ích đi kèm
* Xem trạng thái sân realtime

---

## 1.6 Đặt sân

* Chọn ngày đặt
* Chọn khung giờ
* Chọn sân
* Đặt nhiều khung giờ
* Tính tổng tiền tự động
* Đặt cọc
* Sinh mã check-in
* Kiểm tra trùng lịch
* Giữ slot realtime (Booking Lock)
* Chống double booking
* Xác nhận booking
* Hủy booking
* Xem lịch sử booking
* Xem trạng thái booking

---

## 1.7 Waitlist

* Tham gia danh sách chờ
* Nhận thông báo khi có slot trống
* Tự động ưu tiên người chờ
* Hủy waitlist

---

## 1.8 Thanh toán

* Thanh toán VNPAY
* Thanh toán online
* Theo dõi trạng thái thanh toán
* Thanh toán đặt cọc
* Hoàn tiền
* Xem lịch sử giao dịch
* Retry payment khi thất bại

---

## 1.9 Review & Rating

* Đánh giá sân
* Chấm điểm sao
* Viết bình luận
* Sửa review
* Xóa review
* Xem phản hồi chủ sân
* Mỗi booking chỉ được review 1 lần

---

## 1.10 Notification

* Nhận thông báo realtime
* Thông báo booking thành công
* Thông báo hủy sân
* Thông báo thanh toán
* Thông báo waitlist
* Đánh dấu đã đọc

---

# 2. Chức năng Chủ sân (Owner)

## 2.1 Quản lý trung tâm thể thao

* Tạo Sport Center
* Cập nhật thông tin trung tâm
* Quản lý địa chỉ
* Quản lý vị trí Google Maps
* Upload hình ảnh trung tâm
* Bật/tắt hoạt động trung tâm

---

## 2.2 Quản lý sân

* Tạo sân
* Chỉnh sửa sân
* Xóa mềm sân
* Quản lý trạng thái sân
* Quản lý loại sân
* Quản lý sân indoor/outdoor
* Upload ảnh sân
* Chọn ảnh đại diện

---

## 2.3 Quản lý khung giờ

* Tạo timeslot
* Chỉnh sửa giá
* Thiết lập giờ hoạt động
* Bật/tắt slot
* Cấu hình giá theo giờ
* Cấu hình giá cuối tuần

---

## 2.4 Quản lý booking

* Xem danh sách booking
* Xác nhận booking
* Hủy booking
* Check-in khách hàng
* Quét/check mã booking
* Xem lịch đặt sân
* Theo dõi realtime booking

---

## 2.5 Quản lý dịch vụ bổ sung

* Thêm dịch vụ
* Chỉnh sửa dịch vụ
* Quản lý giá dịch vụ
* Quản lý tồn kho
* Upload icon/hình ảnh
* Bật/tắt dịch vụ

Ví dụ:

* nước uống
* thuê vợt
* thuê bóng
* áo bib
* khăn lạnh

---

## 2.6 Quản lý review

* Xem review
* Phản hồi review
* Theo dõi rating trung bình
* Xử lý feedback xấu

---

## 2.7 Dashboard & Thống kê

* Thống kê doanh thu
* Thống kê booking
* Thống kê sân phổ biến
* Thống kê giờ cao điểm
* Tỷ lệ hủy booking
* Tổng lượt khách
* Tổng số review
* Revenue analytics

---

# 3. Chức năng Admin

## 3.1 Quản lý người dùng

* Xem danh sách user
* Khóa/mở tài khoản
* Phân quyền
* Quản lý role
* Theo dõi hoạt động user

---

## 3.2 Quản lý chủ sân

* Duyệt chủ sân
* Khóa chủ sân
* Kiểm tra thông tin trung tâm
* Quản lý sân vi phạm

---

## 3.3 Quản lý toàn hệ thống

* Quản lý tất cả booking
* Quản lý tất cả giao dịch
* Theo dõi doanh thu hệ thống
* Giám sát hoạt động realtime
* Soft delete dữ liệu

---

## 3.4 Quản lý nội dung

* Quản lý review xấu
* Xóa review vi phạm
* Kiểm duyệt nội dung

---

## 3.5 Báo cáo hệ thống

* Tổng doanh thu
* Tổng số booking
* Tổng số user
* Tổng số chủ sân
* Top sân nổi bật
* Analytics dashboard

---

# 4. AI Features (Gemini AI)

## 4.1 AI Chatbot

* Chat tư vấn sân
* Trả lời câu hỏi người dùng
* Tư vấn thời gian đặt sân
* Tư vấn giá
* Hỗ trợ tìm sân phù hợp
* Hỏi đáp tự nhiên

Ví dụ:

```text id="l45r0n"
"Sân cầu lông nào gần tôi dưới 150k?"
"Khung giờ nào ít đông?"
"Có sân futsal gần trung tâm không?"
```

---

## 4.2 Recommendation System

* Gợi ý sân cá nhân hóa
* Phân tích lịch sử booking
* Phân tích sở thích người dùng
* Gợi ý theo vị trí
* Gợi ý theo ngân sách
* Gợi ý theo khung giờ thường đặt

---

## 4.3 AI User Behavior Analysis

* Phân tích thói quen người dùng
* Dự đoán khung giờ yêu thích
* Dự đoán sân phù hợp
* Gợi ý đặt sân sớm

---

# 5. Realtime Features (SignalR)

## 5.1 Realtime Booking

* Đồng bộ trạng thái sân realtime
* Cập nhật slot realtime
* Chống double booking realtime
* Countdown giữ slot

---

## 5.2 Notification Realtime

* Push notification realtime
* Booking status realtime
* Payment status realtime
* Waitlist notification realtime

---

# 6. Security & System Features

## 6.1 Security

* JWT Authentication
* Role-based Authorization
* Password Hashing
* Refresh Token
* Secure API
* Validate request
* Rate limiting
* Soft delete

---

## 6.2 Performance

* Redis caching
* Query optimization
* Database indexing
* Concurrency handling
* Distributed locking
* Transaction management

---

# 7. Backend Architecture Features

Hệ thống áp dụng:

* Clean Architecture
* Domain-Driven Design (DDD)
* CQRS
* MediatR
* Repository Pattern
* Unit of Work
* Dependency Injection
* RESTful API
* Docker
* CI/CD
* Unit Testing (xUnit)

---

# 8. Công nghệ sử dụng

## Backend

* ASP.NET Core
* Entity Framework Core
* Microsoft SQL Server
* Redis
* SignalR
* Docker

## AI & Maps

* Google Gemini AI
* Google Maps Platform

## Payment

* VNPAY
