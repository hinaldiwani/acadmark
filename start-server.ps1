# AcadMark Server Startup Script
# This script ensures clean server startup by killing any existing processes on the port

Write-Host "🔄 AcadMark Server Startup" -ForegroundColor Cyan
Write-Host ""

# Get port from .env or use default
$port = 3000
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "PORT=(\d+)") {
        $port = $matches[1]
    }
}

Write-Host "📍 Target port: $port" -ForegroundColor Yellow

# Kill any processes using the port (excluding system processes)
Write-Host "🔍 Checking for existing processes on port $port..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
             Select-Object -ExpandProperty OwningProcess | 
             Where-Object { $_ -ne 0 -and $_ -ne 4 } | 
             Select-Object -Unique

if ($processes) {
    Write-Host "⚠️  Found processes using port $port. Stopping them..." -ForegroundColor Yellow
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "   ✓ Stopped process $pid" -ForegroundColor Green
        } catch {
            Write-Host "   ✗ Could not stop process $pid" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 1
} else {
    Write-Host "✓ Port $port is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting AcadMark server..." -ForegroundColor Green
Write-Host ""

# Start the server with nodemon
nodemon server.js
