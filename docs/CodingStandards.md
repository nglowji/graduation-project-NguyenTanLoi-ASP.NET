# SmartSport Coding Standards (Senior Level)

Tài liệu này quy định các tiêu chuẩn lập trình cho dự án SmartSport, đảm bảo code được viết đồng nhất, dễ bảo trì và mở rộng theo chuẩn Clean Architecture & DDD.

---

## 1. Kiến Trúc (Architecture)
Dự án tuân thủ **Clean Architecture** chia làm 4 lớp chính:

- **Domain**: Chứa Entities, Value Objects, Enums, Domain Events. Không phụ thuộc vào bất kỳ lớp nào khác.
- **Application**: Chứa Interfaces, MediatR Commands/Queries, DTOs, Mappers, Validators, Behaviours.
- **Infrastructure**: Chứa Implementation của Interfaces (Repositories, Email, Maps, Payment Services, v.v.).
- **Api**: Chứa Controllers, Middleware, Configuration, Background Jobs.

---

## 2. Quy Tắc Đặt Tên (Naming Conventions)

- **Interfaces**: Phải bắt đầu bằng chữ `I` (ví dụ: `IPitchRepository`).
- **Entities/Models**: Sử dụng danh từ số ít (ví dụ: `Pitch`, `Booking`).
- **MediatR**:
    - Command: `[Action][Entity]Command` (ví dụ: `CreatePitchCommand`).
    - Query: `Get[Entity][Details]Query` (ví dụ: `GetPitchByIdQuery`).
    - Handler: `[CommandName]Handler`.
- **DTOs**: Sử dụng hậu tố `Dto` hoặc `Response`/`Request` (ví dụ: `PitchDto`, `CreatePaymentRequest`).

---

## 3. Clean Code & Senior Patterns

### 3.1. Result Pattern
Không ném (throw) Exception cho các logic nghiệp vụ thông thường. Sử dụng `Result<T>` pattern để trả về kết quả thành công hoặc thất bại.
```csharp
public async Task<Result<Guid>> Handle(CreateBookingCommand request, CancellationToken ct)
{
    if (isConflict) return Result<Guid>.Failure("Sân đã bị đặt");
    // ... logic
    return Result<Guid>.Success(booking.Id);
}
```

### 3.2. CQRS với MediatR
- Mỗi Command/Query phải nằm trong folder riêng biệt bao gồm: `Command/Query`, `Handler`, `Validator`, `Response`.
- Logic nghiệp vụ (Business Logic) phải nằm ở **Handler** hoặc **Domain Entity**, không được nằm ở Controller.

### 3.3. Validation
- Sử dụng **FluentValidation** cho tất cả các Request đầu vào.
- Tự động bắt lỗi Validation thông qua `ValidationBehaviour` để trả về `400 Bad Request`.

### 3.4. Repository Pattern
- Controller chỉ giao tiếp với `IMediator`.
- Handler giao tiếp với các `IRepository` hoặc `IApplicationDbContext`.
- Luôn sử dụng `AsNoTracking()` cho các truy vấn Read-only để tối ưu hiệu năng.

### 3.5. Dependency Injection
- Đăng ký Services theo đúng Scope:
    - `Scoped`: Repositories, DbContext, Services nghiệp vụ.
    - `Singleton`: Caching, Utilities không trạng thái.
    - `Transient`: Các Helper đơn giản.

---

## 4. Database & EF Core
- Sử dụng **Fluent API** thay vì Data Annotations để cấu hình Entity.
- Luôn sử dụng **Migrations** để thay đổi Schema.
- Transaction: Sử dụng `TransactionBehaviour` cho các Commands thay đổi dữ liệu để đảm bảo tính toàn vẹn (ACID).

---

## 5. Security
- **Authentication**: JWT Bearer Token.
- **Authorization**: Sử dụng Policy-based hoặc Role-based. Luôn kiểm tra quyền sở hữu (Ownership) khi chỉnh sửa dữ liệu (ví dụ: Chủ sân chỉ được sửa sân của mình).
- **Sensitive Data**: Không bao giờ hardcode API Key, Secret vào mã nguồn. Sử dụng `appsettings.json` và User Secrets.

---

## 6. Logging & Monitoring
- Sử dụng **Serilog** để log các thông tin quan trọng.
- Log theo cấu trúc (Structured Logging) để dễ dàng tìm kiếm trên Seq hoặc ELK.
- Luôn log các lỗi (Exceptions) kèm theo Context (User ID, Request ID).

---

## 7. UI/Frontend (React)
- **Component**: Chia nhỏ components, sử dụng Tailwind CSS.
- **State Management**: Sử dụng Zustand cho Global State.
- **API Calls**: Sử dụng Axios với Interceptors để xử lý JWT tự động.
- **Performance**: Sử dụng `react-query` cho caching và đồng bộ dữ liệu server.

---

## 8. Domain-Driven Design (DDD) - Nâng Cao
- **Rich Domain Model**: Ưu tiên đẩy logic nghiệp vụ vào Entity (Domain Logic) thay vì để Handler phình to (Anemic Domain Model). Entity nên có các phương thức để thay đổi trạng thái (ví dụ: `Booking.Confirm()`, `Pitch.UpdateStatus()`).
- **Value Objects**: Sử dụng Value Objects cho các thuộc tính đi kèm nhau (ví dụ: `Money`, `Address`, `Coordinates`) để đảm bảo tính bất biến (Immutability) và tự kiểm soát logic (Validation).
- **Domain Events**: Sử dụng Domain Events để thực hiện các hành động phụ thuộc (Side-effects) như gửi Email, thông báo SignalR mà không làm nghẽn luồng chính.

---

## 9. Xử lý đồng thời & Hiệu năng (Concurrency & Performance)
- **Optimistic Concurrency**: Sử dụng `RowVersion` (Timestamp) cho các Entity quan trọng như `Booking`, `TimeSlot` để tránh tình trạng "Lost Update" khi nhiều người cùng đặt 1 sân.
- **Caching Strategy**: 
    - Sử dụng **In-memory cache** cho các dữ liệu ít thay đổi (Danh mục, Cấu hình hệ thống).
    - Sử dụng **Redis** cho Distributed Cache (Session, Rate limiting).
    - Áp dụng **Cache-Aside pattern**: Check cache trước, nếu miss thì đọc DB và update cache.
- **Async/Await**: Luôn sử dụng lập trình bất đồng bộ xuyên suốt từ Controller xuống Database. Tránh sử dụng `.Result` hoặc `.Wait()` gây deadlock.

---

## 10. Background Tasks & Reliability
- **Hangfire/Quartz**: Sử dụng cho các tác vụ tốn thời gian hoặc định kỳ (Quét các đơn đặt sân hết hạn thanh toán, gửi báo cáo doanh thu hàng ngày).
- **Idempotency**: Đảm bảo các API (đặc biệt là API thanh toán) có tính Idempotent để tránh xử lý trùng lặp khi client retry.

---

## 11. Kiểm thử (Testing Strategy)
- **Unit Testing**: 
    - Tập trung test logic trong Domain Entities và Application Handlers.
    - Sử dụng `Moq` để mock dependencies.
    - Sử dụng `FluentAssertions` để viết code test dễ đọc.
- **Integration Testing**: Test luồng API thực tế với In-Memory Database hoặc Docker Testcontainers.
- **Naming Test**: `[MethodName]_[Scenario]_[ExpectedResult]` (ví dụ: `Confirm_WhenPaid_ShouldSetStatusToConfirmed`).

---

## 12. API Documentation & Versioning
- **Swagger/OpenAPI**: Luôn viết XML Comments cho Controller và DTO để Swagger hiển thị tài liệu rõ ràng.
- **Versioning**: Sử dụng URL Versioning (ví dụ: `/api/v1/...`). Tránh các thay đổi gây breaking changes cho client.

---

## 13. Quy trình Review Code (Senior Checklist)
- [ ] Code có tuân thủ nguyên tắc SOLID không?
- [ ] Có logic nghiệp vụ nào bị "rò rỉ" ra lớp Api hoặc Infrastructure không?
- [ ] Các truy vấn DB đã tối ưu chưa (tránh N+1 problem, thiếu Index)?
- [ ] Các dữ liệu nhạy cảm đã được bảo vệ chưa?
- [ ] Code có dễ Unit Test không?
- [ ] Có handle các trường hợp Edge Cases (Null, Empty, Timeout) chưa?
