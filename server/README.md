# Sports Pitch Booking API

API backend cho hệ thống đặt sân thể thao, được xây dựng theo Clean Architecture và Domain-Driven Design.

## 🏗️ Kiến trúc

Dự án tuân thủ **Clean Architecture** với 4 layers:

```
server/
├── Domain/              # Domain Layer - Business Logic Core
│   ├── Entities/       # Domain Entities (User, Pitch, Booking, etc.)
│   ├── ValueObjects/   # Value Objects (Money, Address, TimeRange)
│   ├── Enums/          # Domain Enums
│   ├── Exceptions/     # Domain Exceptions
│   └── Common/         # Base classes & Interfaces
│
├── Application/         # Application Layer - Use Cases
│   ├── Features/       # CQRS Commands & Queries
│   │   └── Bookings/
│   │       ├── Commands/
│   │       ├── Queries/
│   │       └── DTOs/
│   ├── Common/
│   │   ├── Behaviours/ # MediatR Pipeline Behaviours
│   │   ├── Interfaces/ # Repository Interfaces
│   │   ├── Models/     # Result, PagedResult
│   │   └── Exceptions/
│   └── DependencyInjection.cs
│
├── Infrastructure/      # Infrastructure Layer - External Concerns
│   ├── Data/
│   │   ├── Configurations/  # EF Core Configurations
│   │   └── ApplicationDbContext.cs
│   ├── Repositories/   # Repository Implementations
│   └── DependencyInjection.cs
│
└── Api/                # Presentation Layer - API Endpoints
    ├── Controllers/
    ├── Middlewares/
    ├── Program.cs
    └── appsettings.json
```

## 🎯 Nguyên tắc thiết kế

### SOLID Principles
- ✅ Single Responsibility
- ✅ Open/Closed
- ✅ Liskov Substitution
- ✅ Interface Segregation
- ✅ Dependency Inversion

### Design Patterns
- **CQRS**: Commands (write) và Queries (read) tách biệt
- **Repository Pattern**: Abstraction cho data access
- **Unit of Work**: DbContext như transaction boundary
- **Result Pattern**: Không throw exception cho business failures
- **MediatR**: Decoupling requests và handlers

### Domain-Driven Design
- **Entities**: User, Pitch, Booking (có identity)
- **Value Objects**: Money, Address, TimeRange (immutable)
- **Aggregates**: Pitch (với TimeSlots), Booking (với Transaction)
- **Domain Events**: Cross-aggregate communication

## 🚀 Bắt đầu

### Prerequisites
- .NET 8.0 SDK
- SQL Server (LocalDB hoặc SQL Server)
- Visual Studio 2022 hoặc VS Code

### Cài đặt

1. **Clone repository**
```bash
cd server
```

2. **Restore packages**
```bash
dotnet restore
```

3. **Update connection string**
Sửa `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SportsPitchBooking_Dev;..."
  }
}
```

4. **Tạo database migrations**
```bash
cd Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../Api
```

5. **Update database**
```bash
dotnet ef database update --startup-project ../Api
```

6. **Run application**
```bash
cd ../Api
dotnet run
```

API sẽ chạy tại: `https://localhost:5001` (hoặc port được config)

Swagger UI: `https://localhost:5001`

## 📦 Dependencies

### Domain Layer
- Không có external dependencies (Pure C#)

### Application Layer
- MediatR (CQRS pattern)
- FluentValidation (Input validation)
- AutoMapper (Entity → DTO mapping)

### Infrastructure Layer
- Entity Framework Core (ORM)
- SQL Server Provider

### API Layer
- Serilog (Structured logging)
- Swashbuckle (Swagger/OpenAPI)

## 🔧 Development

### Tạo Migration mới
```bash
cd Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../Api
dotnet ef database update --startup-project ../Api
```

### Build Solution
```bash
dotnet build
```

### Run Tests (khi có)
```bash
dotnet test
```

## 📝 API Endpoints

### Health Check
- `GET /health` - Health check endpoint
- `GET /api/health` - Detailed health status

### Bookings
- `GET /api/v1/bookings/{id}` - Get booking by ID
- `POST /api/v1/bookings` - Create new booking
- `POST /api/v1/bookings/{id}/cancel` - Cancel booking

## 🔐 Security

- Input validation với FluentValidation
- Global exception handling
- Structured logging (không log sensitive data)
- SQL injection prevention (EF Core parameterized queries)

## 📊 Logging

Logs được lưu tại:
- Console output (Development)
- File: `logs/log-{Date}.txt`

Log levels:
- **Information**: Business operations
- **Warning**: Expected errors
- **Error**: Unexpected errors
- **Critical**: System failures

## 🎨 Code Standards

Tuân thủ theo `.kiro/skills/dotnet-api-senior.md`:
- Clean Code principles
- SOLID principles
- DRY (Don't Repeat Yourself)
- Meaningful naming conventions
- Single Responsibility per method/class
- Comprehensive error handling

## 📚 Tài liệu tham khảo

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [MediatR](https://github.com/jbogard/MediatR)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)

## 📄 License

Private project - All rights reserved
