# .NET API Senior Development Standards

## Nguyên tắc thiết kế tổng quan

### Clean Architecture
- Áp dụng kiến trúc phân lớp rõ ràng: Presentation → Application → Domain → Infrastructure
- Domain layer không phụ thuộc vào bất kỳ layer nào khác
- Dependency Injection cho tất cả các services
- Sử dụng Interfaces để đảm bảo loose coupling
- Mỗi layer chỉ phụ thuộc vào layer bên trong, không phụ thuộc vào layer bên ngoài

### SOLID Principles
- **Single Responsibility**: Mỗi class chỉ có một lý do để thay đổi
- **Open/Closed**: Mở cho mở rộng, đóng cho sửa đổi
- **Liskov Substitution**: Subclass phải thay thế được base class mà không làm hỏng logic
- **Interface Segregation**: Nhiều interface nhỏ chuyên biệt hơn một interface lớn đa năng
- **Dependency Inversion**: Phụ thuộc vào abstraction, không phụ thuộc vào implementation cụ thể

## Cấu trúc dự án chuẩn

### Tổ chức thư mục
- **Api/**: Presentation Layer - Controllers, Filters, Middlewares
- **Application/**: Application Layer - Commands, Queries, DTOs, Interfaces
- **Domain/**: Domain Layer - Entities, Value Objects, Domain Events, Business Rules
- **Infrastructure/**: Infrastructure Layer - Database, Repositories, External Services
- **Tests/**: Unit Tests, Integration Tests, Architecture Tests

### Quy tắc phân lớp
- Controller không chứa business logic, chỉ làm routing và orchestration
- Business logic nằm trong Domain Entities và Application Handlers
- Database access chỉ thông qua Repository pattern
- External services được abstract bằng interfaces trong Application layer

## Clean Code Standards

### Naming Conventions
- Sử dụng tên có ý nghĩa, tránh viết tắt không rõ ràng
- Boolean variables: bắt đầu với `Is`, `Has`, `Can`, `Should`
- Methods: sử dụng động từ rõ ràng (`Calculate`, `Process`, `Validate`, `Create`)
- Classes: sử dụng danh từ (`OrderProcessor`, `UserValidator`, `PaymentService`)
- Constants: UPPER_CASE hoặc PascalCase
- Private fields: bắt đầu với underscore `_repository`, `_logger`
- Async methods: kết thúc với `Async` suffix

### Method Design
- Mỗi method chỉ làm một việc (Single Responsibility)
- Method không quá 20-30 dòng code
- Tối đa 3-4 parameters, nếu nhiều hơn thì dùng object
- Tránh deep nesting (> 3 levels), sử dụng early return
- Tránh side effects không mong muốn
- Pure functions khi có thể (same input → same output)

### Code Organization
- Không có magic numbers hoặc magic strings, sử dụng constants
- Không hardcode values, sử dụng configuration
- Comments chỉ giải thích "why", không giải thích "what"
- Xóa code không dùng, không comment out code
- Group related code together
- Sắp xếp members theo thứ tự: constants → fields → constructors → public methods → private methods

### DRY Principle (Don't Repeat Yourself)
- Không duplicate code, extract thành methods hoặc classes
- Sử dụng inheritance hoặc composition để tái sử dụng code
- Tạo utility classes cho logic dùng chung
- Sử dụng extension methods cho các operations thường xuyên

## Architecture Patterns

### CQRS Pattern
- Tách biệt Commands (write) và Queries (read)
- Commands thay đổi state, không return data
- Queries return data, không thay đổi state
- Sử dụng MediatR để implement CQRS
- Mỗi Command/Query có một Handler riêng

### Repository Pattern
- Mỗi Aggregate Root có một Repository
- Repository chỉ làm việc với Aggregate Roots, không phải tất cả entities
- Repository interface nằm trong Domain layer
- Repository implementation nằm trong Infrastructure layer
- Không expose IQueryable ra ngoài Repository

### Unit of Work Pattern
- Sử dụng DbContext như Unit of Work
- Transaction scope rõ ràng
- SaveChanges chỉ gọi một lần cho mỗi business operation
- Rollback tự động khi có exception

### Domain Events
- Sử dụng Domain Events cho cross-aggregate communication
- Events được raise trong Domain Entities
- Event Handlers nằm trong Application layer
- Events giúp decouple aggregates

## Domain-Driven Design

### Entities
- Có identity duy nhất (Id)
- Mutable nhưng được protect bằng encapsulation
- Private setters, public methods để thay đổi state
- Factory methods để tạo instances
- Validation logic trong entity methods
- Business rules được enforce trong entity

### Value Objects
- Không có identity, chỉ có values
- Immutable (sử dụng records trong C#)
- Equality based on values, không phải reference
- Self-validating trong constructor
- Ví dụ: Money, Address, Email, PhoneNumber

### Aggregates
- Một cluster của entities và value objects
- Có một Aggregate Root làm entry point
- Consistency boundary - transactions không vượt qua aggregate boundary
- References giữa aggregates chỉ bằng Id, không phải object reference
- Aggregate Root đảm bảo invariants của toàn bộ aggregate

### Domain Services
- Sử dụng khi logic không thuộc về một entity cụ thể
- Stateless operations
- Orchestrate nhiều entities/aggregates
- Ví dụ: PricingService, ShippingCalculator

## API Design Standards

### RESTful Conventions
- Sử dụng HTTP verbs đúng: GET, POST, PUT, PATCH, DELETE
- Resource-based URLs, không phải action-based
- Plural nouns cho collections: `/api/users`, `/api/orders`
- Nested resources khi có relationship: `/api/users/{id}/orders`
- API versioning: `/api/v1/users` hoặc header-based

### Response Standards
- Consistent response format cho tất cả endpoints
- Success responses: 200 OK, 201 Created, 204 No Content
- Error responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
- Sử dụng ProblemDetails cho error responses
- Include meaningful error messages và error codes

### DTOs (Data Transfer Objects)
- Không expose Domain Entities trực tiếp qua API
- Tạo DTOs riêng cho Request và Response
- Sử dụng AutoMapper hoặc Mapster để map giữa Entity và DTO
- Validation attributes trên DTOs
- Immutable DTOs (records) khi có thể

### Pagination
- Luôn implement pagination cho list endpoints
- Support page-based hoặc cursor-based pagination
- Return metadata: total count, page number, page size, has next/previous
- Default page size hợp lý (10-50 items)

### Filtering & Sorting
- Query parameters cho filtering: `?status=active&category=electronics`
- Query parameters cho sorting: `?sortBy=createdAt&sortOrder=desc`
- Support multiple sort fields
- Validate filter và sort parameters

## Validation Strategy

### Input Validation
- Validate tất cả inputs từ client
- Sử dụng FluentValidation cho complex validation rules
- Validation ở nhiều layers: DTO validation, Domain validation
- Return clear validation error messages
- Validate data types, formats, ranges, required fields

### Business Rules Validation
- Business rules nằm trong Domain layer
- Throw Domain Exceptions khi vi phạm business rules
- Validation trước khi thay đổi state
- Consistent validation messages

### Security Validation
- Input sanitization để prevent injection attacks
- Validate file uploads (type, size, content)
- Rate limiting cho API endpoints
- CORS configuration đúng
- Authentication và Authorization checks

## Exception Handling

### Exception Hierarchy
- Tạo custom exceptions: DomainException, NotFoundException, ValidationException
- Inherit từ appropriate base exceptions
- Include meaningful messages và context
- Không catch exceptions nếu không xử lý được

### Global Exception Handler
- Middleware để catch tất cả unhandled exceptions
- Log exceptions với đầy đủ context
- Return appropriate HTTP status codes
- Không expose sensitive information trong error messages
- Different handling cho Development vs Production

### Logging Exceptions
- Log level phù hợp: Error cho exceptions, Warning cho expected errors
- Include stack trace, request context, user context
- Structured logging với correlation IDs
- Log aggregation và monitoring

## Performance Optimization

### Database Optimization
- Sử dụng `AsNoTracking()` cho read-only queries
- Eager loading với `Include()` khi cần related data
- Projection với `Select()` để chỉ lấy fields cần thiết
- Avoid N+1 query problems
- Index các columns thường xuyên query và filter
- Use compiled queries cho queries thường xuyên
- Batch operations thay vì individual operations

### Caching Strategy
- Cache data ít thay đổi (reference data, configurations)
- Distributed cache (Redis) cho multi-instance applications
- Memory cache cho single-instance
- Cache invalidation strategy rõ ràng
- Set appropriate expiration times
- Cache keys có naming convention

### Async/Await Best Practices
- Luôn sử dụng async/await cho I/O operations
- Không block với `.Result` hoặc `.Wait()`
- Pass CancellationToken xuống tất cả async methods
- Sử dụng `ConfigureAwait(false)` trong library code
- Avoid async void, chỉ dùng cho event handlers

### Memory Management
- Dispose IDisposable objects đúng cách (using statements)
- Avoid large object allocations
- Use object pooling cho frequently created objects
- Use Span<T> và Memory<T> cho high-performance scenarios
- Minimize boxing/unboxing

## Security Best Practices

### Authentication & Authorization
- JWT tokens cho stateless authentication
- Secure token storage và transmission
- Token expiration và refresh strategy
- Role-based và Claims-based authorization
- Principle of least privilege

### Data Protection
- Hash passwords với strong algorithms (BCrypt, Argon2)
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Secure connection strings và secrets
- Environment-based configuration

### API Security
- Rate limiting để prevent abuse
- Input validation và sanitization
- CORS configuration đúng
- API keys hoặc OAuth cho third-party access
- Audit logging cho sensitive operations

### SQL Injection Prevention
- Sử dụng parameterized queries
- ORM (Entity Framework) để avoid raw SQL
- Validate và sanitize inputs
- Principle of least privilege cho database users

## Testing Standards

### Unit Tests
- Test coverage > 80% cho business logic
- Test một concern tại một thời điểm
- Arrange-Act-Assert pattern
- Mock external dependencies
- Fast execution (< 1 second per test)
- Descriptive test names: `MethodName_Scenario_ExpectedBehavior`

### Integration Tests
- Test interactions giữa components
- Test database operations
- Test API endpoints end-to-end
- Use test database hoặc in-memory database
- Clean up test data sau mỗi test

### Test Organization
- Separate test projects cho Unit và Integration tests
- Mirror production code structure
- Shared test utilities và fixtures
- Test data builders cho complex objects

## Logging Standards

### Structured Logging
- Sử dụng Serilog hoặc NLog
- Log structured data, không phải plain strings
- Include correlation IDs cho request tracking
- Log levels phù hợp: Trace, Debug, Information, Warning, Error, Critical

### What to Log
- Request/Response cho API calls
- Business operations và outcomes
- Exceptions với full context
- Performance metrics
- Security events (login, logout, authorization failures)

### What NOT to Log
- Passwords hoặc sensitive credentials
- Personal Identifiable Information (PII) nếu không cần thiết
- Credit card numbers hoặc financial data
- Full request/response bodies trong production

### Log Context
- User ID hoặc username
- Request ID hoặc correlation ID
- Timestamp
- Environment (Dev, Staging, Production)
- Application version

## Configuration Management

### Environment-Based Configuration
- appsettings.json cho base configuration
- appsettings.{Environment}.json cho environment-specific
- Environment variables cho sensitive data
- Azure Key Vault hoặc AWS Secrets Manager cho production secrets

### Configuration Validation
- Validate configuration at startup
- Fail fast nếu configuration invalid
- Use Options pattern trong .NET
- Strongly-typed configuration classes

## Dependency Injection

### Service Lifetimes
- **Transient**: Mỗi request tạo instance mới (stateless services)
- **Scoped**: Một instance per HTTP request (DbContext, repositories)
- **Singleton**: Một instance cho toàn application (caching, configuration)

### Registration Best Practices
- Register interfaces, không phải concrete types
- Extension methods cho service registration
- Avoid service locator anti-pattern
- Constructor injection, không phải property injection

## Code Review Checklist

### Architecture & Design
- [ ] Code tuân thủ Clean Architecture
- [ ] SOLID principles được áp dụng
- [ ] Design patterns phù hợp với use case
- [ ] Separation of concerns rõ ràng
- [ ] Dependencies đúng hướng (inward)

### Clean Code
- [ ] Naming conventions rõ ràng và consistent
- [ ] Methods ngắn gọn, single responsibility
- [ ] Không có deep nesting
- [ ] Không có magic numbers/strings
- [ ] Code dễ đọc, dễ hiểu

### Logic & Business Rules
- [ ] Business logic trong Domain layer
- [ ] Validation đầy đủ và đúng chỗ
- [ ] Error handling comprehensive
- [ ] Edge cases được xử lý
- [ ] State transitions hợp lệ

### Performance
- [ ] Database queries được optimize
- [ ] Async/await đúng cách
- [ ] Caching strategy phù hợp
- [ ] Không có memory leaks
- [ ] Batch operations cho bulk data

### Security
- [ ] Input validation và sanitization
- [ ] Authentication/Authorization checks
- [ ] Sensitive data không bị expose
- [ ] SQL injection prevention
- [ ] HTTPS và secure communication

### Testing
- [ ] Unit tests với coverage > 80%
- [ ] Integration tests cho critical paths
- [ ] Tests pass và có ý nghĩa
- [ ] Test names descriptive
- [ ] Mock dependencies đúng cách

### Documentation
- [ ] XML comments cho public APIs
- [ ] README updated
- [ ] API documentation (Swagger)
- [ ] Architecture decisions documented

### Code Quality
- [ ] Không có code smells
- [ ] Không có duplicate code
- [ ] Logging đầy đủ và có ý nghĩa
- [ ] Exception handling đúng
- [ ] Code formatting consistent

## Tools & Libraries Standards

### Required Libraries
- **ORM**: Entity Framework Core
- **Validation**: FluentValidation
- **Mapping**: AutoMapper hoặc Mapster
- **Mediator**: MediatR
- **Logging**: Serilog
- **Testing**: xUnit, FluentAssertions, Moq

### Recommended Libraries
- **API Documentation**: Swashbuckle (Swagger)
- **Authentication**: ASP.NET Core Identity, JWT
- **Caching**: Redis, IMemoryCache
- **API Versioning**: Asp.Versioning.Mvc
- **Health Checks**: Microsoft.Extensions.Diagnostics.HealthChecks

## Continuous Improvement

### Code Metrics
- Cyclomatic complexity < 10
- Method length < 30 lines
- Class length < 300 lines
- Test coverage > 80%
- Code duplication < 5%

### Refactoring
- Refactor khi thấy code smells
- Improve code readability
- Reduce complexity
- Eliminate duplication
- Keep tests green

### Learning & Growth
- Stay updated với .NET updates
- Learn new patterns và practices
- Code reviews để học từ team
- Share knowledge với team
- Document lessons learned

---

**Lưu ý quan trọng**: 
- Đây là các quy chuẩn nên tuân thủ nghiêm ngặt
- Trong trường hợp đặc biệt cần linh hoạt, phải có lý do rõ ràng và được document
- Code phải sạch, tối ưu và đảm bảo logic nghiệp vụ chính xác
- Luôn ưu tiên maintainability và readability hơn cleverness
