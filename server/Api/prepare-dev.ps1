$ErrorActionPreference = "SilentlyContinue"

function Stop-PortListener([int]$Port) {
    $stopped = @{}
    Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | ForEach-Object {
        $processId = $_.OwningProcess
        if ($processId -and $processId -ne 0 -and -not $stopped.ContainsKey($processId)) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            $stopped[$processId] = $true
        }
    }
}

Stop-PortListener 5164

if (Get-Command docker -ErrorAction SilentlyContinue) {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
    Push-Location $repoRoot
    try {
        docker compose up -d --remove-orphans postgres | Out-Null
        docker stop smartsport-api 2>$null | Out-Null
        docker rm smartsport-api 2>$null | Out-Null
    }
    finally {
        Pop-Location
    }
}

exit 0
