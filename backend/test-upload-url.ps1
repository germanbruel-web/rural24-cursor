# Test POST /api/uploads/signed-url - Obtener firma de Cloudinary

$body = @{
    filename = "tractor-image.jpg"
    folder = "ads"
} | ConvertTo-Json

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "POST /api/uploads/signed-url (Cloudinary)" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/uploads/signed-url" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✅ ÉXITO - Firma de upload generada:" -ForegroundColor Green
    Write-Host ""
    Write-Host "Upload URL: $($response.data.uploadUrl)" -ForegroundColor Cyan
    Write-Host "Public URL: $($response.data.publicUrl)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Params para el upload:" -ForegroundColor Yellow
    $response.data.uploadParams | ConvertTo-Json
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Respuesta del servidor:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}
