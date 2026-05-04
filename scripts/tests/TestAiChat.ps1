# Test AI Chat Feature

Write-Host "=== Testing AI Chat Feature ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser@gmail.com"
    password = "Test@123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5164/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "Login successful!" -ForegroundColor Green
}
catch {
    Write-Host "Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Chat with AI
Write-Host "`n2. Chatting with AI..." -ForegroundColor Yellow
$chatBody = @{
    message = "Toi muon tim san bong da gan nha vao cuoi tuan"
} | ConvertTo-Json

try {
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:5164/api/v1/ai/chat" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body $chatBody -ContentType "application/json"
    
    Write-Host "AI Response:" -ForegroundColor Green
    Write-Host $chatResponse.response -ForegroundColor White
}
catch {
    Write-Host "Chat failed: $_" -ForegroundColor Red
}

# Step 3: Get Recommendations
Write-Host "`n3. Getting recommendations..." -ForegroundColor Yellow
try {
    $recsResponse = Invoke-RestMethod -Uri "http://localhost:5164/api/v1/ai/recommendations?latitude=10.7769&longitude=106.7009" -Method Get -Headers @{ Authorization = "Bearer $token" }
    
    Write-Host "Recommendations:" -ForegroundColor Green
    Write-Host $recsResponse.explanation -ForegroundColor White
}
catch {
    Write-Host "Recommendations failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
