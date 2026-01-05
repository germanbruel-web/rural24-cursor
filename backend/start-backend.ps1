# Start Backend Script
Set-Location $PSScriptRoot
Write-Host "🚀 Starting Rural24 Backend..." -ForegroundColor Green
Write-Host "📍 Directory: $PWD" -ForegroundColor Cyan
Write-Host "🔧 Node: $(node --version)" -ForegroundColor Cyan
Write-Host "📦 npm: $(npm --version)" -ForegroundColor Cyan
Write-Host ""

# Start Next.js
npm run dev

# Keep alive
Read-Host "Press Enter to stop"
