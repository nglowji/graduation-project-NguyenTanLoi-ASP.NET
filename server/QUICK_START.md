# Quick Start Guide

## 🚀 Khởi Động API Trong 3 Bước

### Bước 1: Build Project
```bash
cd server
dotnet build
```

### Bước 2: Chạy Migrations (Nếu Chưa Có Database)
```bash
cd Infrastructure
dotnet ef database update --startup-project ../Api
```

### Bước 3: Start API
```bash
cd Api
dotnet run --launch-profile http
```

API sẽ chạy tại: **http://localhost:5164**

---

## ✅ Kiểm Tra API Hoạt Động

### Health Check
```bash
curl http://localhost:5164/health
```

**Expected:** `Healthy`

### Swagger UI
Mở trình duyệt: **http://localhost:5164/swagger**

---

## 🧪 Test API Nhanh

### Test Register
```powershell
powershell -File test-register-valid.ps1
```

### Test Login
```powershell
powershell -File test-login-new-user.ps1
```

### Test Complete Flow
```powershell
powershell -File test-complete-flow.ps1
```

---

## 📝 Test Account

Tạo user mới qua API hoặc dùng test account:

| Email | Password | Role |
|-------|----------|------|
| testuser@gmail.com | Test@123456 | Customer |

---

## 🔧 Seed Data (Optional)

### Generate Password Hashes
```bash
dotnet run --project Tools/Tools.csproj
```

### Seed Database
```bash
sqlcmd -S "localhost" -d SportsPitchBooking_Dev -i seed-data.sql
```

### Update Seed Passwords
```bash
sqlcmd -S "localhost" -d SportsPitchBooking_Dev -i update-seed-passwords.sql
```

---

## 📚 Documentation

- **API Testing Summary:** `API_TESTING_SUMMARY.md`
- **Concurrency Guide:** `README_CONCURRENCY.md`
- **Payment Integration:** `README_PAYMENT.md`
- **Features Overview:** `README_FEATURES.md`

---

## 🎯 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập
- `GET /api/v1/auth/profile` - Xem profile (requires auth)

### Pitches
- `GET /api/v1/pitches/search` - Tìm kiếm sân
- `GET /api/v1/pitches/{id}` - Chi tiết sân
- `GET /api/v1/pitches/{id}/timeslots` - Xem time slots

### Bookings
- `POST /api/v1/bookings/lock` - Lock time slot
- `POST /api/v1/bookings` - Tạo booking
- `GET /api/v1/bookings/{id}` - Chi tiết booking
- `POST /api/v1/bookings/{id}/cancel` - Hủy booking

### Payments
- `POST /api/v1/payments` - Tạo payment URL
- `GET /api/v1/payments/callback` - VNPAY callback
- `GET /api/v1/payments/{id}` - Chi tiết payment

---

## 🛠️ Troubleshooting

### Port Already In Use
```powershell
# Kill process on port 5164
$conn = Get-NetTCPConnection -LocalPort 5164 -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

### Database Connection Error
Kiểm tra connection string trong `Api/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SportsPitchBooking_Dev;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

### Migration Error
```bash
# Drop database và tạo lại
cd Infrastructure
dotnet ef database drop --startup-project ../Api
dotnet ef database update --startup-project ../Api
```

---

## 📞 Support

Xem chi tiết trong `API_TESTING_SUMMARY.md` hoặc check Swagger UI tại http://localhost:5164/swagger
