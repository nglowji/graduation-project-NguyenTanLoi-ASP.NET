# Script để test các booking endpoints
param(
    [string]$Token = "",
    [string]$TimeSlotId = "00000000-0000-0000-0000-000000000000",
    [string]$BookingDate = (Get-Date -Format "yyyy-MM-dd")
)

$ApiUrl = "http://localhost:5164/api/v1"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testing Booking Endpoints" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

if ($Token -eq "") {
    Write-Host "⚠️  Token not provided. Some tests will fail." -ForegroundColor Yellow
    Write-Host "To get token:" -ForegroundColor Yellow
    Write-Host "  1. Login to app" -ForegroundColor Yellow
    Write-Host "  2. Open DevTools (F12)" -ForegroundColor Yellow
    Write-Host "  3. Console: localStorage.getItem('token')" -ForegroundColor Yellow
    Write-Host "  4. Run: .\test-endpoints.ps1 -Token 'your-token'" -ForegroundColor Yellow
    Write-Host ""
}

$Headers = @{
    "Content-Type" = "Authorization" = "Bearer $Token"
}

# Test 1: Check if API is running
Write-Host "Test 1: Checking if API is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/bookings" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ API is running" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ API is running (401 = needs auth)" -ForegroundColor Green
    } elseif ($statusCode -eq 405) {
        Write-Host "✅ API is running (405 = GET not allowed, expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ API error: $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Test POST /bookings (single slot)
Write-Host "Test 2: Testing POST /bookings (single slot)..." -ForegroundColor Cyan
$singlePayload = @{
    timeSlotId = $TimeSlotId
    bookingDate = $BookingDate
    selectedServices = @()
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/bookings" -Method POST -Headers $Headers -Body $singlePayload -ContentType "application/json"
    Write-Host "✅ Single slot endpoint works!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    Write-Host "❌ Single slot failed: $statusCode" -ForegroundColor Red
    if ($errorBody) {
        Write-Host "   Error: $errorBody" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Test POST /bookings/multi-slot
Write-Host "Test 3: Testing POST /bookings/multi-slot..." -ForegroundColor Cyan
$multiPayload = @{
    timeSlots = @(
        @{
            timeSlotId = $TimeSlotId
            bookingDate = $BookingDate
        }
    )
    selectedServices = @()
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/bookings/multi-slot" -Method POST -Headers $Headers -Body $multiPayload -ContentType "application/json"
    Write-Host "✅ Multi-slot endpoint works!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    Write-Host "❌ Multi-slot failed: $statusCode" -ForegroundColor Red
    if ($errorBody) {
        Write-Host "   Error: $errorBody" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Check route registration
Write-Host "Test 4: Checking available routes..." -ForegroundColor Cyan
Write-Host "Expected routes:" -ForegroundColor Gray
Write-Host "  POST /api/v1/bookings" -ForegroundColor Gray
Write-Host "  POST /api/v1/bookings/lock" -ForegroundColor Gray
Write-Host "  POST /api/v1/bookings/release-lock/{id}" -ForegroundColor Gray
Write-Host "  POST /api/v1/bookings/multi-slot" -ForegroundColor Gray
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "If multi-slot returns 405:" -ForegroundColor Yellow
Write-Host "  1. Endpoint might not be registered" -ForegroundColor Yellow
Write-Host "  2. Backend needs restart" -ForegroundColor Yellow
Write-Host "  3. Route conflict with other endpoints" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart backend: dotnet run --project server/Api" -ForegroundColor White
Write-Host "  2. Check logs for errors" -ForegroundColor White
Write-Host "  3. Verify DI registration for handler" -ForegroundColor White
