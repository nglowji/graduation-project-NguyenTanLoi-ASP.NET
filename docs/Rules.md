# Quy Định AI Khi Viết Code Chuẩn Senior Backend .NET

## 1. Nguyên tắc tổng quát

* Luôn ưu tiên:

  * Readability > Cleverness
  * Maintainability > Short code
  * Scalability > Temporary fix
  * Explicit > Implicit

* Code phải:

  * Dễ đọc
  * Dễ test
  * Dễ mở rộng
  * Dễ debug
  * Production-ready

* Không viết code kiểu “demo”, “tutorial”, “hack nhanh”.

* Không dùng magic string, magic number.

* Không hardcode:

  * connection string
  * API key
  * secret
  * URL
  * role name
  * business rule

* Ưu tiên:

  * SOLID
  * Clean Architecture
  * DDD nếu domain phức tạp
  * CQRS khi phù hợp
  * RESTful API standards

---

# 2. Kiến trúc dự án

## Bắt buộc phân tầng rõ ràng

```txt
src/
 ├── Api
 ├── Application
 ├── Domain
 ├── Infrastructure
 └── Shared
```

## Quy tắc layer

### Domain

Chỉ chứa:

* Entity
* Value Object
* Enum
* Domain Event
* Interface domain

KHÔNG được chứa:

* EF Core
* HttpContext
* SQL
* External API
* Logging

---

### Application

Chứa:

* Use Case
* CQRS
* DTO
* Validator
* Service abstraction

KHÔNG chứa:

* SQL trực tiếp
* Business logic nằm lung tung
* HttpContext access trực tiếp

---

### Infrastructure

Chứa:

* EF Core
* Repository implementation
* Redis
* External API
* Email
* File storage

---

### API

Chỉ:

* nhận request
* validate cơ bản
* gọi application
* trả response

Controller phải mỏng.

---

# 3. Quy định Entity

## Entity phải encapsulate logic

❌ Sai:

```csharp
public class Order
{
    public decimal TotalPrice { get; set; }
}
```

✅ Đúng:

```csharp
public class Order
{
    public decimal TotalPrice { get; private set; }

    public void UpdateTotal(decimal amount)
    {
        if(amount < 0)
            throw new DomainException("Invalid amount");

        TotalPrice = amount;
    }
}
```

---

## Không dùng public setter bừa bãi

Ưu tiên:

* private set
* constructor
* method domain

---

## Entity phải có behavior

Không biến entity thành “data container”.

---

# 4. Repository Rules

## Không tạo generic repository vô nghĩa

❌ Tránh:

```csharp
IGenericRepository<T>
```

nếu:

* chỉ wrap EF Core
* không thêm business value

---

## Repository phải business-oriented

✅ Ví dụ:

```csharp
Task<Order?> GetPendingOrderByUserIdAsync(Guid userId);
```

❌ Không nên:

```csharp
GetAll()
Find()
Delete()
```

---

# 5. EF Core Rules

## Luôn dùng AsNoTracking cho query read-only

```csharp
_context.Users
    .AsNoTracking()
```

---

## Không SELECT *

Luôn projection DTO:

```csharp
.Select(x => new UserDto
{
    Id = x.Id,
    Name = x.Name
})
```

---

## Tránh N+1 Query

Ưu tiên:

* projection
* include hợp lý
* split query khi cần

---

## Transaction rõ ràng

```csharp
await using var transaction =
    await _context.Database.BeginTransactionAsync();
```

---

# 6. API Design

## RESTful chuẩn

### Naming

✅

```txt
GET /api/users
GET /api/users/{id}
POST /api/orders
```

❌

```txt
/getAllUsers
/createOrder
```

---

## HTTP Status chuẩn

* 200 OK
* 201 Created
* 204 NoContent
* 400 BadRequest
* 401 Unauthorized
* 403 Forbidden
* 404 NotFound
* 409 Conflict
* 500 InternalServerError

---

## Response format thống nhất

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {}
}
```

---

# 7. Exception Handling

## Không try-catch vô nghĩa

❌

```csharp
try
{
}
catch(Exception ex)
{
    throw;
}
```

---

## Dùng Global Exception Middleware

```csharp
app.UseMiddleware<ExceptionMiddleware>();
```

---

## Không expose internal error

❌

```json
{
  "error": "SQL timeout at server..."
}
```

---

# 8. Validation

## Dùng FluentValidation

Không validate thủ công trong controller.

✅

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
    .EmailAddress();
```

---

# 9. Authentication & Authorization

## Bắt buộc dùng JWT chuẩn

* Access Token
* Refresh Token
* Expiration
* Secure claims

---

## Không authorize bằng role string hardcode

❌

```csharp
[Authorize(Roles = "Admin")]
```

✅

```csharp
public static class Roles
{
    public const string Admin = "Admin";
}
```

---

# 10. Logging

## Dùng structured logging

✅

```csharp
_logger.LogInformation(
    "User {UserId} created order {OrderId}",
    userId,
    orderId);
```

❌

```csharp
_logger.LogInformation(
    $"User {userId} created order {orderId}");
```

---

# 11. Async/Await Rules

## Tất cả IO phải async

* DB
* API
* File
* Redis

---

## Không dùng .Result hoặc .Wait()

❌

```csharp
var result = task.Result;
```

---

# 12. Dependency Injection

## Không new service thủ công

❌

```csharp
var service = new UserService();
```

✅

```csharp
builder.Services.AddScoped<IUserService, UserService>();
```

---

# 13. Naming Convention

## Quy tắc đặt tên

| Thành phần    | Convention     |
| ------------- | -------------- |
| Class         | PascalCase     |
| Method        | PascalCase     |
| Variable      | camelCase      |
| Interface     | I + PascalCase |
| Private field | _camelCase     |

---

## Tên phải rõ nghĩa

❌

```csharp
var data;
```

✅

```csharp
var pendingOrders;
```

---

# 14. Performance Rules

## Pagination bắt buộc cho list lớn

```csharp
.Skip((page - 1) * pageSize)
.Take(pageSize)
```

---

## Cache khi phù hợp

Ưu tiên:

* Redis
* Memory cache

---

## Không query trong loop

❌

```csharp
foreach(var item in items)
{
    await _context.Users.FindAsync(item.Id);
}
```

---

# 15. Security Rules

## Không trust client data

Luôn validate:

* input
* permission
* ownership

---

## Password phải hash

Dùng:

* BCrypt
* ASP.NET Identity

---

## Không lưu plain text secret

Dùng:

* Secret Manager
* Environment Variable
* Azure Key Vault

---

# 16. Code Cleanliness

## Method ngắn

Ưu tiên:

* < 30 dòng
* single responsibility

---

## Không nested quá sâu

❌

```csharp
if()
{
    if()
    {
        if()
        {
        }
    }
}
```

Ưu tiên guard clause.

---

# 17. Testing

## Phải có:

* Unit Test
* Integration Test

---

## Không test implementation detail

Test behavior.

---

# 18. CQRS Rules

## Query không modify data

## Command không return object lớn

Command chỉ nên return:

* Id
* success
* status

---

# 19. Git Rules

## Commit message chuẩn

✅

```txt
feat: add booking concurrency handling
fix: resolve duplicate payment issue
refactor: optimize order query projection
```

---

# 20. AI Coding Rules

## AI phải:

* Sinh code production-ready
* Không generate deprecated API
* Không generate insecure code
* Không generate anti-pattern
* Không generate code thiếu validation
* Không generate business logic trong controller
* Không generate God Class
* Không generate duplicated code

---

## Khi viết feature mới AI phải tự động nghĩ đến:

* validation
* logging
* transaction
* exception handling
* authorization
* scalability
* performance
* clean architecture
* testability

---

# 21. Chuẩn Senior Backend .NET

Senior-level code phải đạt:

* Clear architecture
* Strong domain modeling
* Predictable behavior
* High cohesion
* Low coupling
* Easy maintenance
* Production scalability
* Secure by default
* Observable (logging/monitoring)
* Testable
* Team-friendly

---

# 22. Quy định cuối cùng

AI KHÔNG được:

* overengineer
* underengineer
* code theo tutorial
* copy stackoverflow style
* generate dead code
* generate unused abstraction
* generate fake async
* generate unnecessary repository/service layer

AI PHẢI:

* giải thích reasoning kỹ thuật khi cần
* tối ưu readability
* tối ưu maintainability
* ưu tiên kiến trúc thực chiến enterprise .NET hiện đại (.NET 8+)
