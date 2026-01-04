Set-Location $PSScriptRoot
Write-Host "Working directory: $(Get-Location)"
Write-Host "App directory exists: $(Test-Path app)"
npm run dev
