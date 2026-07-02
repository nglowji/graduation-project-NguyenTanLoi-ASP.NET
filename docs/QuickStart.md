# Quick Start Guide

## Start API Locally

```bash
cd server/Api
dotnet run
```

`dotnet run` tự chuẩn bị môi trường dev (PostgreSQL Docker, cổng 5164) trước khi khởi động API.

Hoặc dùng script từ thư mục gốc repo: `.\scripts\start-backend.ps1`

### 1. Start PostgreSQL

The backend development config uses PostgreSQL at `localhost:5432`:

```text
Database: SportsPitchBooking_Dev
Username: postgres
Password: postgres
```

Option A: Docker Desktop

Install Docker Desktop first if the `docker` command is not available:

```text
https://www.docker.com/products/docker-desktop/
```

After installation, restart PowerShell or VS Code terminal, then check:

```bash
docker --version
docker compose version
```

From the repository root:

```bash
docker compose up -d postgres
```

Check that PostgreSQL is running:

```bash
docker compose ps
```

Option B: PostgreSQL installer, without Docker

Install PostgreSQL 16 from:

```text
https://www.postgresql.org/download/windows/
```

During setup, use this password for the `postgres` user:

```text
postgres
```

After installation, create the development database:

```powershell
createdb -U postgres SportsPitchBooking_Dev
```

If `createdb` is not found, use pgAdmin or add PostgreSQL `bin` to PATH. The default path is usually:

```text
C:\Program Files\PostgreSQL\16\bin
```

### 2. Build Backend

```bash
cd server
dotnet build
```

### 3. Apply Migrations

```bash
cd Infrastructure
dotnet ef database update --startup-project ../Api
```

If `dotnet ef` is missing:

```bash
dotnet tool install --global dotnet-ef
```

### 4. Start API

```bash
cd server/Api
dotnet run
```

API URL:

```text
http://localhost:5164
```

## Check API

Health check:

```bash
curl http://localhost:5164/health
```

Swagger:

```text
http://localhost:5164/swagger
```

## Test Accounts

Seed data creates these accounts when the backend starts successfully:

```text
admin@smartsport.vn / Admin@123
owner@smartsport.vn / Owner@123
customer@smartsport.vn / Customer@123
```

## Troubleshooting

### Failed to connect to 127.0.0.1:5432

This means PostgreSQL is not running locally.

Fix with Docker Desktop:

```bash
docker compose up -d postgres
```

If PowerShell says `docker` is not recognized, Docker Desktop is not installed or the terminal was opened before Docker added itself to PATH. Install Docker Desktop, reopen the terminal, then run the command again.

Fix without Docker:

```powershell
createdb -U postgres SportsPitchBooking_Dev
```

Then make sure the PostgreSQL service is running in Windows Services.

The development connection string is in `server/Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=SportsPitchBooking_Dev;Username=postgres;Password=postgres"
  }
}
```

### Port 5164 Already In Use

```powershell
.\scripts\stop-backend.ps1
```

Hoặc thủ công:

```powershell
$conn = Get-NetTCPConnection -LocalPort 5164 -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

### Reset Local Database

This deletes all local PostgreSQL data:

```bash
docker compose down -v
docker compose up -d postgres
```

Then rerun migrations:

```bash
cd server/Infrastructure
dotnet ef database update --startup-project ../Api
```
