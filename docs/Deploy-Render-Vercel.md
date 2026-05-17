# Deploy SmartSport: Render Backend + Vercel Frontend

## 1. Render PostgreSQL

Create a Render PostgreSQL database, then copy the external connection values into a .NET connection string:

```text
ConnectionStrings__DefaultConnection=Host=<host>;Port=5432;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

The backend now uses `Npgsql.EntityFrameworkCore.PostgreSQL`, so production does not need SQL Server.

## 2. Render Backend Web Service

Create a Render Web Service from the GitHub repository.

```text
Root Directory: server
Runtime: Docker
Dockerfile Path: Dockerfile
```

Render form values:

```text
Name: smartsport-api
Region: Singapore, if available, or the nearest region
Branch: main
Root Directory: server
Runtime: Docker
Dockerfile Path: Dockerfile
Docker Build Context Directory: .  (or leave default)
Instance Type: Free/Starter for testing
```

Set these environment variables:

```text
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:10000
Swagger__Enabled=true
ConnectionStrings__DefaultConnection=<postgres-connection-string>
Jwt__SecretKey=<new-strong-secret>
Jwt__Issuer=SmartSportAPI
Jwt__Audience=SmartSportClient
Cors__AllowedOrigins=https://<vercel-app>.vercel.app,http://localhost:5173,http://localhost:3000
ClientApp__BaseUrl=https://<vercel-app>.vercel.app
ClientApp__PaymentResultUrl=https://<vercel-app>.vercel.app/payment-result
VnPay__ReturnUrl=https://<render-service>.onrender.com/api/v1/payments/callback
ZaloPay__CallbackUrl=https://<render-service>.onrender.com/api/v1/payments/zalopay/callback
ZaloPay__ReturnUrl=https://<vercel-app>.vercel.app/payment-result
```

Optional environment variables, depending on enabled features:

```text
ConnectionStrings__Redis=<redis-url>
ConnectionStrings__MongoConnection=<mongodb-uri>
MongoDB__DatabaseName=SportsPitchBooking_NoSql
GeminiAI__ApiKey=<gemini-api-key>
GeminiAI__Model=gemini-2.0-flash
GoogleMaps__ApiKey=<google-maps-api-key>
GoogleAuth__ClientId=<google-oauth-client-id>
Email__Host=smtp.gmail.com
Email__Port=587
Email__Username=<gmail-address>
Email__Password=<gmail-app-password>
Email__DisplayName=SmartSport Platform
VnPay__TmnCode=<vnpay-tmn-code>
VnPay__HashSecret=<vnpay-hash-secret>
ZaloPay__AppId=<zalopay-app-id>
ZaloPay__Key1=<zalopay-key1>
ZaloPay__Key2=<zalopay-key2>
```

How to fill Render Environment Variables:

```text
NAME_OF_VARIABLE: ASPNETCORE_ENVIRONMENT
value: Production

NAME_OF_VARIABLE: ConnectionStrings__DefaultConnection
value: Host=<host>;Port=5432;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

Click `Add Environment Variable` for every row. You can also prepare a local `.env` text file with `KEY=value` lines and use `Add from .env`.

How to get or generate keys:

```text
PostgreSQL connection string:
Render Dashboard > New > PostgreSQL > create database.
Open the database > Info/Connections.
Use External Database URL, or copy host/database/user/password into the .NET connection string above.

Jwt__SecretKey:
Generate a random secret of at least 32 characters.
PowerShell: [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))

Render backend URL:
After first deploy, Render gives a URL like https://smartsport-api.onrender.com.
Use it in VnPay__ReturnUrl and ZaloPay__CallbackUrl.

Vercel frontend URL:
After frontend deploy, Vercel gives a URL like https://smartsport.vercel.app.
Use it in Cors__AllowedOrigins, ClientApp__BaseUrl, ClientApp__PaymentResultUrl, and ZaloPay__ReturnUrl.

Gmail app password:
Google Account > Security > 2-Step Verification > App passwords.
Use the generated 16-character app password, not your normal Gmail password.

Gemini key:
Google AI Studio > Get API key.

Google Maps key:
Google Cloud Console > APIs & Services > Credentials > Create API key.
Enable Maps JavaScript API, Geocoding API, Directions API, and Distance Matrix API if those features are used.

VNPAY/ZaloPay sandbox:
Register sandbox merchant accounts in their developer portals and copy TmnCode/HashSecret or AppId/Key1/Key2.
For a first smoke test, payment keys can stay sandbox-only.
```

Use sandbox payment credentials for the first deployment. Rotate any secrets that were previously committed before going live.

## 3. Vercel Frontend

Import the same GitHub repository into Vercel.

```text
Root Directory: client
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Set these environment variables:

```text
VITE_API_URL=https://<render-service>.onrender.com/api/v1
VITE_SIGNALR_URL=https://<render-service>.onrender.com/hubs/booking
```

`VITE_SIGNALR_URL` is optional locally because the client can derive it from `VITE_API_URL`, but set it explicitly in Vercel for clarity.

Vite reads `VITE_*` variables at build time. After adding or changing `VITE_API_URL` in Vercel, redeploy the frontend so the production bundle stops using the local fallback.

## 4. GitHub Actions Secrets

Add these repository secrets in GitHub Actions:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RENDER_DEPLOY_HOOK_URL
```

Copy `RENDER_DEPLOY_HOOK_URL` directly from Render Web Service Settings > Deploy Hook. Do not wrap it in quotes or add extra text. The workflow trims whitespace, validates the URL, then calls:

```bash
curl --fail --show-error --silent --request POST "$DEPLOY_HOOK"
```

## 5. Sanity Checks

After deploy:

```text
GET https://<render-service>.onrender.com/
GET https://<render-service>.onrender.com/health
Open https://<render-service>.onrender.com/swagger
Open https://<vercel-app>.vercel.app
Login/register works
Booking calls do not show CORS errors
Payment sandbox returns to /payment-result
Admin dashboard and AI chat call the API successfully
```

## 6. Common Render Error

If Render logs show:

```text
System.ArgumentException: Keyword not supported: 'host'
at Microsoft.Data.SqlClient.SqlConnectionString...
at Microsoft.EntityFrameworkCore.SqlServer...
```

The deployed backend is still using SQL Server while the Render database string is PostgreSQL. Fix checklist:

```text
1. Confirm server/Infrastructure/DependencyInjection.cs uses options.UseNpgsql(...), not UseSqlServer(...).
2. Confirm server/Infrastructure/Infrastructure.csproj has Npgsql.EntityFrameworkCore.PostgreSQL.
3. Commit and push those backend changes to the same branch Render is deploying.
4. In Render Web Service > Settings, confirm Root Directory is server and Runtime is Docker.
5. Trigger Manual Deploy > Clear build cache & deploy.
```

Do not change the PostgreSQL variable to `Server=...`; keep:

```text
ConnectionStrings__DefaultConnection=Host=<host>;Port=5432;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

If Render logs show:

```text
System.Net.Sockets.SocketException: Name or service not known
at System.Net.Dns.GetHostEntryOrAddressesCore...
at Npgsql...
```

The backend is using PostgreSQL correctly, but the `Host` value in `ConnectionStrings__DefaultConnection` is wrong or cannot be resolved.

Fix checklist:

```text
1. Open Render Dashboard > PostgreSQL database > Info/Connections.
2. Copy the database Hostname exactly, without https:// and without quotes.
3. Make sure the Web Service and PostgreSQL database are in the same Render account/project.
4. In Web Service > Environment, update ConnectionStrings__DefaultConnection.
5. Save changes, then Manual Deploy > Clear build cache & deploy.
```

Correct examples:

```text
# If using Render internal hostname:
ConnectionStrings__DefaultConnection=Host=<internal-hostname>;Port=5432;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true

# If using Render external hostname:
ConnectionStrings__DefaultConnection=Host=<external-hostname>;Port=5432;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

Wrong examples:

```text
ConnectionStrings__DefaultConnection=Host=https://xxxxx.render.com;...
ConnectionStrings__DefaultConnection=Host=<host>;...
ConnectionStrings__DefaultConnection=postgresql://user:password@host/database
ConnectionStrings__DefaultConnection=Host=postgres://user:password@host/database;...
```
