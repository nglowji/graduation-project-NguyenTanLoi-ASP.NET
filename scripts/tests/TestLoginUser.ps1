# Test Login API with newly registered user
$baseUrl = "http://localhost:5164"

Write-Host "=== Testing Login API ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test: Login with newly registered user" -ForegroundColor Yellow
$loginData = @{
    email = "testuser@gmail.com"
    password = "Test@123456"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $loginData
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -UseBasicParsing
    
    Write-Host "Success - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" -ForegroundColor Red
        Write-Host $responseBody
    }
}

Write-Host ""
Write-Host "=== Test Completed ===" -ForegroundColor Cyan
