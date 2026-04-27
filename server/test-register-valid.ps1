# Test Register API with valid data
$baseUrl = "http://localhost:5164"

Write-Host "=== Testing Register API ===" -ForegroundColor Cyan
Write-Host ""

# Test case 1: Valid registration
Write-Host "Test 1: Valid Registration" -ForegroundColor Yellow
$validUser = @{
    email = "testuser@gmail.com"
    password = "Test@123456"
    fullName = "Nguyen Van Test"
    phoneNumber = "0987654321"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $validUser
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $validUser `
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
