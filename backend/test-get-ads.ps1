# Test GET /api/ads - Listar anuncios

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "GET http://localhost:3000/api/ads" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ads?limit=5&status=active" `
        -Method GET `
        -ContentType "application/json"

    Write-Host "✅ ÉXITO - Anuncios obtenidos:" -ForegroundColor Green
    Write-Host ""
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
