# Complete API Flow Test Script
$baseUrl = "http://localhost:5164"
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPORTS PITCH BOOKING API TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1/7] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
    Write-Host "  Success - API is healthy" -ForegroundColor Green
} catch {
    Write-Host "  Failed - API is not responding" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Register New User
Write-Host "[2/7] Testing Register API..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$newUser = @{
    email = "user$timestamp@test.com"
    password = "Test@123456"
    fullName = "Test User $timestamp"
    phoneNumber = "0987654321"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $newUser `
        -UseBasicParsing
    
    $registerData = $registerResponse.Content | ConvertFrom-Json
    $token = $registerData.token
    $userId = $registerData.userId
    
    Write-Host "  Success - User registered" -ForegroundColor Green
    Write-Host "  UserId: $userId" -ForegroundColor Gray
    Write-Host "  Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "  Failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Login
Write-Host "[3/7] Testing Login API..." -ForegroundColor Yellow
$loginData = @{
    email = "user$timestamp@test.com"
    password = "Test@123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -UseBasicParsing
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    
    Write-Host "  Success - Login successful" -ForegroundColor Green
    Write-Host "  Token refreshed" -ForegroundColor Gray
} catch {
    Write-Host "  Failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Get Profile (Protected Endpoint)
Write-Host "[4/7] Testing Protected Endpoint (Get Profile)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $profileResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/profile" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $profile = $profileResponse.Content | ConvertFrom-Json
    Write-Host "  Success - Profile retrieved" -ForegroundColor Green
    Write-Host "  Email: $($profile.email)" -ForegroundColor Gray
    Write-Host "  FullName: $($profile.fullName)" -ForegroundColor Gray
    Write-Host "  Role: $($profile.role)" -ForegroundColor Gray
} catch {
    Write-Host "  Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Search Pitches (Public Endpoint)
Write-Host "[5/7] Testing Search Pitches API..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/pitches/search?pageNumber=1&pageSize=10" `
        -Method GET `
        -UseBasicParsing
    
    $searchData = $searchResponse.Content | ConvertFrom-Json
    Write-Host "  Success - Found $($searchData.totalCount) pitches" -ForegroundColor Green
    
    if ($searchData.items.Count -gt 0) {
        $firstPitch = $searchData.items[0]
        Write-Host "  First Pitch: $($firstPitch.name)" -ForegroundColor Gray
        Write-Host "  Price: $($firstPitch.pricePerHour) VND/hour" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Available Time Slots
Write-Host "[6/7] Testing Get Available Time Slots..." -ForegroundColor Yellow
if ($searchData.items.Count -gt 0) {
    $pitchId = $searchData.items[0].id
    $today = Get-Date -Format "yyyy-MM-dd"
    
    try {
        $slotsResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/pitches/$pitchId/timeslots?date=$today" `
            -Method GET `
            -UseBasicParsing
        
        $slots = $slotsResponse.Content | ConvertFrom-Json
        Write-Host "  Success - Found $($slots.Count) available time slots" -ForegroundColor Green
        
        if ($slots.Count -gt 0) {
            Write-Host "  First Slot: $($slots[0].startTime) - $($slots[0].endTime)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  Failed - $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  Skipped - No pitches available" -ForegroundColor Yellow
}
Write-Host ""

# Test 7: Validation Test (Invalid Data)
Write-Host "[7/7] Testing Validation (Invalid Password)..." -ForegroundColor Yellow
$invalidUser = @{
    email = "invalid@test.com"
    password = "weak"
    fullName = "Invalid User"
    phoneNumber = "0987654321"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $invalidUser `
        -UseBasicParsing
    
    Write-Host "  Failed - Validation should have rejected this" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "  Success - Validation working correctly (400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "  Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST SUITE COMPLETED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
