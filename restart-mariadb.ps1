# Restart MariaDB service
Write-Host "Stopping MariaDB..." -ForegroundColor Yellow
net stop MariaDB

Start-Sleep -Seconds 2

Write-Host "Starting MariaDB..." -ForegroundColor Yellow
net start MariaDB

Write-Host "MariaDB restarted successfully!" -ForegroundColor Green
