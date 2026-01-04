# Test POST /api/ads - Crear anuncio de tractor

$body = @{
    user_id = "fadd0359-ae43-4cad-9612-cbd639583196"
    category_id = "3773410d-505b-4cfc-874a-865cfe1370d6"
    subcategory_id = "129c86f5-8806-4d19-8b8c-6b680f0bd93e"
    title = "Tractor John Deere 5075E 2020 Excelente Estado"
    description = "Vendo tractor John Deere 5075E modelo 2020 en excelente estado de conservación. Poco uso, siempre mantenimiento oficial. Ideal para fincas medianas. Cabina con aire acondicionado, dirección hidrostática, 4x4."
    price = 35000
    currency = "USD"
    province = "Buenos Aires"
    city = "Pergamino"
    location = "Pergamino"
    attributes = @{
        tipotractor = "Tractor mediano"
        marca = "John Deere"
        modelo = "5075E"
        anio = "2020"
        condicion = "Usado"
        potencia_hp = 75
        traccion = "4x4"
        tipo_transmision = "Mecánica sincronizada"
        tipo_direccion = "Hidráulica"
        caracteristicas = @("Cabina", "Aire acondicionado", "Asiento operador")
    }
    images = @(
        @{
            url = "https://example.com/tractor1.jpg"
            path = "ads/tractor1.jpg"
        }
    )
    contact_phone = "+54 9 11 1234-5678"
    contact_email = "vendedor@rural24.com"
    status = "active"
    approval_status = "pending"
} | ConvertTo-Json -Depth 10

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "POST http://localhost:3000/api/ads" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ads" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✅ ÉXITO - Anuncio creado:" -ForegroundColor Green
    Write-Host ""
    $response | ConvertTo-Json -Depth 10
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
