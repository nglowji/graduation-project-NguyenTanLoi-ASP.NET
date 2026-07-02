param(
    [switch]$Docker
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$stoppedPids = @{}

$connections = Get-NetTCPConnection -LocalPort 5164 -ErrorAction SilentlyContinue
foreach ($conn in $connections) {
  $processId = $conn.OwningProcess
  if ($processId -and $processId -ne 0 -and -not $stoppedPids.ContainsKey($processId)) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    $stoppedPids[$processId] = $true
    Write-Host "Đã dừng tiến trình chiếm cổng 5164 (PID $processId)."
  }
}

Get-Process -Name "Api" -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  Write-Host "Đã dừng tiến trình Api (PID $($_.Id))."
}

if ($Docker -and (Get-Command docker -ErrorAction SilentlyContinue)) {
  docker stop smartsport-api 2>$null | Out-Null
  Write-Host "Đã dừng container smartsport-api."
}
elseif (Get-Command docker -ErrorAction SilentlyContinue) {
  docker stop smartsport-api 2>$null | Out-Null
}

Write-Host "Backend đã dừng."
