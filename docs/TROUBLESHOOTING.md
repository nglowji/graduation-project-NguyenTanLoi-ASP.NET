# Hướng dẫn xử lý lỗi (Troubleshooting Guide)

## Lỗi Authentication

### ❌ Lỗi: "Facebook Login chưa được cấu hình"

**Mô tả**: Khi nhấn nút "Facebook" để đăng ký/đăng nhập, hiển thị thông báo lỗi này.

**Nguyên nhân**:
- `VITE_FACEBOOK_APP_ID` chưa được cấu hình trong file `.env` hoặc `.env.production`
- Hoặc giá trị là placeholder `YOUR_FACEBOOK_APP_ID_HERE`

**Giải pháp**:

1. **Tạo Facebook App** (nếu chưa có):
   - Truy cập [Facebook Developers](https://developers.facebook.com/)
   - Tạo app mới với product **Facebook Login**
   - Xem chi tiết tại: [docs/FACEBOOK_AUTH_SETUP.md](./FACEBOOK_AUTH_SETUP.md)

2. **Cấu hình App ID**:
   ```bash
   cd client
   ```
   
   Mở file `.env` và cập nhật:
   ```env
   VITE_FACEBOOK_APP_ID=1234567890123456
   ```
   
   Mở file `.env.production` và cập nhật:
   ```env
   VITE_FACEBOOK_APP_ID=1234567890123456
   ```

3. **Restart development server**:
   ```bash
   npm run dev
   ```

**Tham khảo**: [docs/FACEBOOK_AUTH_SETUP.md](./FACEBOOK_AUTH_SETUP.md)

---

### ❌ Lỗi: "Mật khẩu phải có ít nhất 8 ký tự" (hoặc các lỗi validation khác)

**Mô tả**: Khi đăng ký tài khoản, form báo lỗi về mật khẩu không hợp lệ.

**Nguyên nhân**: Hệ thống yêu cầu mật khẩu mạnh để bảo mật.

**Yêu cầu mật khẩu**:
- ✅ Ít nhất **8 ký tự**
- ✅ Ít nhất **1 chữ HOA** (A-Z)
- ✅ Ít nhất **1 chữ thường** (a-z)
- ✅ Ít nhất **1 chữ số** (0-9)
- ✅ Ít nhất **1 ký tự đặc biệt** (@, #, $, %, &, *, !, v.v.)

**Ví dụ mật khẩu hợp lệ**:
- `Password123!`
- `MySecure@2024`
- `SmartSport#99`

**Giải pháp**: Tạo mật khẩu đáp ứng đầy đủ các yêu cầu trên.

---

### ❌ Lỗi: "Email đã được sử dụng"

**Mô tả**: Không thể đăng ký vì email đã tồn tại trong hệ thống.

**Nguyên nhân**: 
- Email đã được dùng để đăng ký trước đó
- Hoặc đã đăng nhập qua Facebook/Google với email này

**Giải pháp**:
1. Sử dụng email khác để đăng ký
2. Hoặc đăng nhập với email hiện tại (nếu đã có tài khoản)
3. Nếu quên mật khẩu, click **"Quên mật khẩu?"** để reset

---

### ❌ Lỗi: "Invalid email or password"

**Mô tả**: Đăng nhập thất bại.

**Nguyên nhân**:
- Email hoặc mật khẩu không đúng
- Tài khoản bị vô hiệu hóa (inactive)

**Giải pháp**:
1. Kiểm tra lại email và mật khẩu
2. Đảm bảo không có khoảng trắng thừa
3. Kiểm tra Caps Lock
4. Nếu quên mật khẩu: sử dụng chức năng **Quên mật khẩu**
5. Nếu tài khoản bị khóa: liên hệ admin

---

### ❌ Lỗi: "Không thể tải Facebook SDK"

**Mô tả**: Facebook login không hoạt động, console hiển thị lỗi network.

**Nguyên nhân**:
- Mạng bị chặn Facebook
- Ad blocker/Privacy extension chặn Facebook SDK
- Firewall/Proxy chặn kết nối đến Facebook

**Giải pháp**:
1. Tắt Ad blocker cho domain này
2. Thử trình duyệt khác (không có extension)
3. Kiểm tra kết nối mạng
4. Thử VPN nếu Facebook bị chặn

---

## Lỗi Booking

### ❌ Lỗi: "Sân đã được đặt"

**Mô tả**: Không thể đặt sân vì slot đã bị book.

**Nguyên nhân**: Người khác đã đặt sân trước (hệ thống xử lý concurrency).

**Giải pháp**:
1. Chọn khung giờ khác
2. Hoặc chọn sân khác cùng thời gian
3. Đặt nhanh hơn lần sau

---

### ❌ Lỗi: "Token hết hạn"

**Mô tả**: Bị đăng xuất giữa chừng khi thao tác.

**Nguyên nhân**: JWT token hết hạn sau 60 phút.

**Giải pháp**:
1. Đăng nhập lại
2. Token sẽ được refresh tự động trong phiên bản tương lai

---

## Lỗi Payment

### ❌ Lỗi: "Thanh toán thất bại"

**Mô tả**: Không thể hoàn tất thanh toán qua VNPAY.

**Nguyên nhân**:
- Thẻ không đủ số dư
- OTP sai
- Timeout
- Thẻ chưa đăng ký thanh toán online

**Giải pháp**:
1. Kiểm tra số dư thẻ
2. Đảm bảo thẻ đã đăng ký online banking
3. Nhập đúng OTP
4. Thử lại hoặc dùng thẻ khác

---

## Lỗi Server/API

### ❌ Lỗi: "Cannot connect to server"

**Mô tả**: Frontend không kết nối được backend.

**Nguyên nhân**:
- Backend chưa chạy
- Port bị xung đột
- Sai URL API

**Giải pháp**:

**Development**:
```bash
cd server/Api
dotnet run
```

Kiểm tra backend đang chạy tại: `http://localhost:5164`

**Production**:
Kiểm tra biến môi trường:
```env
VITE_API_URL=https://smartsport-api.onrender.com/api/v1
```

---

### ❌ Lỗi: "Database connection failed"

**Mô tả**: Backend không kết nối được database.

**Nguyên nhân**:
- PostgreSQL chưa chạy
- Connection string sai
- Database chưa được migrate

**Giải pháp**:

1. **Kiểm tra PostgreSQL**:
   ```bash
   docker ps
   ```
   Xem container `postgres` có chạy không.

2. **Start PostgreSQL** (nếu dùng Docker):
   ```bash
   docker start postgres
   ```

3. **Migration**:
   ```bash
   cd server/Api
   dotnet ef database update
   ```

---

### ❌ Lỗi: "Redis connection timeout"

**Mô tả**: Cache service không hoạt động.

**Nguyên nhân**: Redis chưa chạy hoặc không thể kết nối.

**Giải pháp**:

Hệ thống sẽ tự động fallback sang `MemoryCache` nếu Redis không khả dụng.

Nếu muốn dùng Redis:
```bash
docker start redis
```

**Lưu ý**: Redis là optional, app vẫn hoạt động bình thường nếu không có Redis.

---

## Lỗi Frontend

### ❌ Lỗi: "Module not found"

**Mô tả**: Build/dev server báo lỗi không tìm thấy module.

**Nguyên nhân**: 
- Dependencies chưa được cài
- Cache bị lỗi

**Giải pháp**:
```bash
cd client
rm -rf node_modules
npm install
npm run dev
```

---

### ❌ Lỗi: "Port 5173 already in use"

**Mô tả**: Vite không thể start vì port bị chiếm.

**Giải pháp**:

**Windows**:
```powershell
# Tìm process đang dùng port 5173
netstat -ano | findstr :5173

# Kill process (thay PID bằng số thực tế)
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
lsof -ti:5173 | xargs kill -9
```

Hoặc dùng port khác:
```bash
npm run dev -- --port 3000
```

---

## Lỗi Build/Deploy

### ❌ Lỗi: "Build failed - VITE_API_URL is not defined"

**Mô tả**: Production build thất bại.

**Nguyên nhân**: `.env.production` chưa cấu hình đầy đủ.

**Giải pháp**:

Tạo/cập nhật `.env.production`:
```env
VITE_API_URL=https://your-api-domain.com/api/v1
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## Liên hệ hỗ trợ

Nếu gặp lỗi không nằm trong danh sách trên:

1. **Kiểm tra logs**:
   - Browser Console (F12)
   - Server logs (terminal chạy backend)
   
2. **GitHub Issues**: [Tạo issue mới](https://github.com/nglowji/graduation-project-NguyenTanLoi-ASP.NET/issues)

3. **Email**: Liên hệ developer qua email trong profile

---

## Các file hướng dẫn khác

- 📘 [Cấu hình Facebook Auth](./FACEBOOK_AUTH_SETUP.md)
- 📘 [Quick Start Guide](./QuickStart.md)
- 📘 [Payment Integration](./PaymentIntegration.md)
- 📘 [API Testing](./ApiTesting.md)
