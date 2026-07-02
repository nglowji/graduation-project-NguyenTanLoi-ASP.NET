$ErrorActionPreference = "Stop"
$apiDir = Join-Path $PSScriptRoot "..\server\Api" | Resolve-Path

Push-Location $apiDir
try {
  dotnet run
}
finally {
  Pop-Location
}
