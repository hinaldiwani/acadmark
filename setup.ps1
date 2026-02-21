# AcadMark MongoDB Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AcadMark - MongoDB Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if MongoDB is installed
Write-Host "Checking MongoDB installation..." -ForegroundColor Yellow
try {
    $mongoVersion = mongod --version | Select-String -Pattern "db version"
    Write-Host "✓ MongoDB is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ MongoDB is not found locally" -ForegroundColor Yellow
    Write-Host "  You can either:" -ForegroundColor Yellow
    Write-Host "  1. Install MongoDB locally: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host "  2. Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas" -ForegroundColor Yellow
    Write-Host ""
}

# Create .env file if it doesn't exist
Write-Host "Checking .env file..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "  Please edit .env file with your MongoDB connection details" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file with your MongoDB connection details" -ForegroundColor White
Write-Host "2. Start MongoDB (if using local installation): mongod" -ForegroundColor White
Write-Host "3. Start the application: npm start" -ForegroundColor White
Write-Host "4. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "5. Login as admin (default: admin@acadmark / admin123)" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see:" -ForegroundColor Yellow
Write-Host "- README.md - Installation and usage guide" -ForegroundColor White
Write-Host "- MONGODB_MIGRATION.md - Migration details" -ForegroundColor White
Write-Host "- MONGODB_REFERENCE.md - MongoDB query reference" -ForegroundColor White
Write-Host ""
