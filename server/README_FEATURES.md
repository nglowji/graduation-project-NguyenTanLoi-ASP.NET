# SmartSport - Features Implementation Guide

## ✅ Đã implement (Phase 1)

### 🎯 Domain Layer
- [x] **Entities**: User, Pitch, TimeSlot, Booking, PaymentTransaction, PitchImage
- [x] **New Entities**: Review, Notification, Amenity, PitchAmenity, SystemConfiguration
- [x] **Value Objects**: Money, Address, TimeRange
- [x] **Enums**: PitchType, PitchStatus, BookingStatus, PaymentStatus, UserRole, NotificationType
- [x] **Domain Services**: BookingDomainService (cancellation policy logic)

### 🎯 Application Layer - CQRS

#### **Bookings**
- [x] CreateBookingCommand - Đặt sân
- [x] CancelBookingCommand - Hủy đặt sân
- [x] ConfirmBookingCommand - Xác nhận đặt sân (Owner)
- [x] GetBookingByIdQuery - Xem chi tiết booking

#### **Pitches**
- [x] SearchPitchesQuery - Tìm kiếm sân (keyword, type, price, location)
- [x] GetAvailableTimeSlotsQuery - Xem khung giờ trống
- [x] CreatePitchCommand - Tạo sân mới (Owner)

#### **Auth** (Cần implement handlers)
- [x] RegisterCommand - Đăng ký
- [x] LoginCommand - Đăng nhập

### 🎯 API Endpoints
- [x] `/api/v1/bookings` - Booking management
- [x] `/api/v1/pitches/search` - Search pitches
- [x] `/api/v1/pitches/{id}/available-slots` - Get available time slots
- [x] `/api/health` - Health check

---

## 🚧 Cần implement tiếp (Phase 2)

### 1. **Authentication & Authorization**

```csharp
// Commands/Queries cần tạo
- RegisterCommandHandler (hash password, create user, generate JWT)
- LoginCommandHandler (verify password, generate JWT)
- RefreshTokenCommand
- ChangePasswordCommand
- UpdateProfileCommand

// Infrastructure
- IJwtTokenService
- IPasswordHasher (BCrypt)
- JWT Configuration in appsettings.json
```

**API Endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `PUT /api/v1/auth/change-password`
- `GET /api/v1/auth/profile`
- `PUT /api/v1/auth/profile`

---

### 2. **Payment Integration (VNPAY/MoMo)**

```csharp
// Commands cần tạo
- CreatePaymentCommand (tạo payment URL)
- ProcessPaymentCallbackCommand (xử lý callback từ gateway)
- RefundPaymentCommand (hoàn tiền khi hủy)

// Services
- IPaymentService
  - CreatePaymentUrl(bookingId, amount, returnUrl)
  - VerifyPaymentCallback(queryParams)
  - ProcessRefund(transactionId, amount)

// Entities đã có
- PaymentTransaction (đã tạo)
```

**API Endpoints:**
- `POST /api/v1/payments/create` - Tạo payment URL
- `GET /api/v1/payments/callback` - VNPAY/MoMo callback
- `POST /api/v1/payments/refund` - Hoàn tiền

---

### 3. **Owner Dashboard Features**

```csharp
// Commands
- UpdatePitchCommand
- DeletePitchCommand
- AddTimeSlotCommand
- UpdateTimeSlotCommand
- DeleteTimeSlotCommand
- LockTimeSlotCommand (khóa sân thủ công)
- UnlockTimeSlotCommand

// Queries
- GetOwnerPitchesQuery
- GetOwnerBookingsQuery (calendar view)
- GetOwnerDashboardStatsQuery (revenue, occupancy rate)
- GetBookingsByDateRangeQuery
```

**API Endpoints:**
- `GET /api/v1/owner/pitches` - Danh sách sân của owner
- `PUT /api/v1/owner/pitches/{id}` - Cập nhật sân
- `DELETE /api/v1/owner/pitches/{id}` - Xóa sân
- `POST /api/v1/owner/pitches/{id}/timeslots` - Thêm khung giờ
- `PUT /api/v1/owner/timeslots/{id}` - Cập nhật khung giờ
- `POST /api/v1/owner/timeslots/{id}/lock` - Khóa sân
- `GET /api/v1/owner/bookings` - Danh sách booking
- `GET /api/v1/owner/dashboard/stats` - Thống kê dashboard

---

### 4. **Real-time Notifications (SignalR)**

```csharp
// Hubs
- NotificationHub : Hub
  - SendNotificationToUser(userId, notification)
  - SendNotificationToOwner(ownerId, notification)

// Services
- INotificationService
  - NotifyBookingCreated(booking)
  - NotifyBookingCancelled(booking)
  - NotifyPaymentSuccess(transaction)

// Infrastructure
- SignalR configuration in Program.cs
- NotificationRepository
```

**SignalR Endpoints:**
- `/hubs/notifications` - WebSocket connection

---

### 5. **Admin Panel Features**

```csharp
// Commands
- ApproveOwnerCommand
- RejectOwnerCommand
- BanUserCommand
- UnbanUserCommand
- UpdateSystemConfigCommand

// Queries
- GetAllUsersQuery (paginated)
- GetAllOwnersQuery (pending approval)
- GetAllTransactionsQuery
- GetSystemConfigQuery
- GetPlatformStatsQuery (total revenue, users, bookings)
```

**API Endpoints:**
- `GET /api/v1/admin/users` - Danh sách users
- `GET /api/v1/admin/owners/pending` - Owners chờ duyệt
- `POST /api/v1/admin/owners/{id}/approve` - Duyệt owner
- `POST /api/v1/admin/owners/{id}/reject` - Từ chối owner
- `POST /api/v1/admin/users/{id}/ban` - Ban user
- `GET /api/v1/admin/transactions` - Lịch sử giao dịch
- `GET /api/v1/admin/config` - System configuration
- `PUT /api/v1/admin/config` - Update config
- `GET /api/v1/admin/stats` - Platform statistics

---

### 6. **Reviews & Ratings**

```csharp
// Commands
- CreateReviewCommand
- UpdateReviewCommand
- DeleteReviewCommand

// Queries
- GetPitchReviewsQuery
- GetUserReviewsQuery

// Entity đã có
- Review (đã tạo)
```

**API Endpoints:**
- `POST /api/v1/pitches/{id}/reviews` - Tạo review
- `PUT /api/v1/reviews/{id}` - Cập nhật review
- `DELETE /api/v1/reviews/{id}` - Xóa review
- `GET /api/v1/pitches/{id}/reviews` - Danh sách reviews

---

### 7. **Booking History & Management**

```csharp
// Queries
- GetUserBookingsQuery (history, filters by status)
- GetUpcomingBookingsQuery
- GetPastBookingsQuery

// Commands
- CompleteBookingCommand (sau khi khách check-in)
- MarkAsNoShowCommand
```

**API Endpoints:**
- `GET /api/v1/bookings/my-bookings` - Lịch sử đặt sân
- `GET /api/v1/bookings/upcoming` - Booking sắp tới
- `GET /api/v1/bookings/past` - Booking đã qua
- `POST /api/v1/bookings/{id}/complete` - Hoàn thành booking

---

### 8. **Google Maps Integration**

```csharp
// Services
- IGoogleMapsService
  - GetDirections(origin, destination)
  - CalculateDistance(origin, destination)
  - GeocodeAddress(address)

// Frontend Integration
- Google Maps JavaScript API
- Display markers for pitches
- Calculate distance from user location
```

---

### 9. **AI Chatbot Integration**

```csharp
// Services
- IChatbotService
  - GetResponse(userMessage, context)
  - SuggestPitches(userPreferences)

// Integration options
- OpenAI API
- Azure Bot Service
- Custom ML model
```

**API Endpoints:**
- `POST /api/v1/chatbot/message` - Send message to chatbot
- `GET /api/v1/chatbot/suggest-pitches` - AI pitch suggestions

---

## 📊 Database Migrations

```bash
# Tạo migration cho các entities mới
cd Infrastructure
dotnet ef migrations add AddReviewsNotificationsAmenities --startup-project ../Api
dotnet ef database update --startup-project ../Api
```

---

## 🔐 Security Checklist

- [ ] JWT Authentication middleware
- [ ] Role-based Authorization ([Authorize(Roles = "Owner")])
- [ ] API Rate Limiting
- [ ] CORS configuration cho production
- [ ] Input validation (FluentValidation)
- [ ] SQL Injection prevention (EF Core parameterized queries)
- [ ] XSS prevention
- [ ] HTTPS enforcement

---

## 🧪 Testing Strategy

### Unit Tests
- Domain entities business logic
- Command/Query handlers
- Domain services

### Integration Tests
- API endpoints
- Database operations
- Payment gateway integration

### E2E Tests
- User booking flow
- Owner management flow
- Admin approval flow

---

## 📈 Performance Optimization

- [ ] Database indexes (đã có trong Configurations)
- [ ] Caching strategy (Redis cho frequently accessed data)
- [ ] AsNoTracking() cho read-only queries (đã implement)
- [ ] Pagination cho tất cả list endpoints (đã implement)
- [ ] CDN cho static assets (images)
- [ ] Background jobs cho email notifications (Hangfire)

---

## 🚀 Deployment Checklist

- [ ] Environment variables configuration
- [ ] Database connection strings
- [ ] Payment gateway credentials (VNPAY/MoMo)
- [ ] JWT secret keys
- [ ] Google Maps API key
- [ ] Logging configuration (Serilog to Azure App Insights)
- [ ] Health checks
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions / Azure DevOps)

---

## 📝 Next Steps

1. **Implement Authentication** (JWT + BCrypt)
2. **Payment Integration** (VNPAY Sandbox)
3. **SignalR for Real-time Notifications**
4. **Owner Dashboard APIs**
5. **Admin Panel APIs**
6. **Google Maps Integration**
7. **AI Chatbot** (Optional - Phase 3)

---

**Ưu tiên implement theo thứ tự:**
1. Auth (Login/Register) - Cần ngay để test các features khác
2. Payment Integration - Core feature
3. Owner Dashboard - Quan trọng cho business
4. Real-time Notifications - Enhance UX
5. Admin Panel - Management
6. Reviews & Ratings - Social proof
7. AI Chatbot - Nice to have
