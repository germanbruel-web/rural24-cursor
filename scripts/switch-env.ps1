param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("local", "staging")]
    [string]$Profile
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$FrontendDir = Join-Path $RootDir "frontend"
$BackendDir = Join-Path $RootDir "backend"

$frontendSource = Join-Path $FrontendDir ".env.$Profile.local"
$backendSource = Join-Path $BackendDir ".env.$Profile.local"
$frontendTarget = Join-Path $FrontendDir ".env.local"
$backendTarget = Join-Path $BackendDir ".env.local"

if (-not (Test-Path $frontendSource)) {
    throw "Missing frontend profile file: $frontendSource"
}

if (-not (Test-Path $backendSource)) {
    throw "Missing backend profile file: $backendSource"
}

Copy-Item -Path $frontendSource -Destination $frontendTarget -Force
Copy-Item -Path $backendSource -Destination $backendTarget -Force

Write-Host ""
Write-Host "Environment switched to profile: $Profile" -ForegroundColor Green
Write-Host "Frontend: $frontendTarget" -ForegroundColor Cyan
Write-Host "Backend:  $backendTarget" -ForegroundColor Cyan
Write-Host ""
