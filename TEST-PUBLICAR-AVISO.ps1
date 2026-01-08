# Script de Testing para Publicar Aviso
# Verifica que todo el flujo funcione correctamente

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🧪 TEST: Publicar Aviso - Flujo Completo" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 CHECKLIST DE TESTING:" -ForegroundColor Yellow
Write-Host ""

Write-Host "PASO 1: Backend corriendo" -ForegroundColor White
Write-Host "  └─ Verificar: http://localhost:3000/api/health" -ForegroundColor Gray
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✅ Backend OK (Status: $($health.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Backend NO responde" -ForegroundColor Red
    Write-Host "  └─ Ejecuta: cd backend-api && npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PASO 2: Frontend corriendo" -ForegroundColor White
Write-Host "  └─ Verificar: http://localhost:5173" -ForegroundColor Gray
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✅ Frontend OK (Status: $($frontend.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Frontend NO responde" -ForegroundColor Red
    Write-Host "  └─ Ejecuta: cd frontend && npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PASO 3: Navegador con DevTools" -ForegroundColor White
Write-Host "  └─ Abre: http://localhost:5173/#/publicar-v3" -ForegroundColor Gray
Write-Host "  └─ Presiona F12 para abrir consola" -ForegroundColor Gray
Write-Host "  ✅ Listo para testing manual" -ForegroundColor Green

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "📝 FLUJO DE PRUEBA:" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Step 1: Seleccionar Categoría" -ForegroundColor White
Write-Host "    └─ Debe venir preseleccionada" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  Step 2: Atributos Dinámicos" -ForegroundColor White
Write-Host "    └─ Completar campos obligatorios" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  Step 3: Ubicación" -ForegroundColor White
Write-Host "    └─ Provincia debe venir preseleccionada" -ForegroundColor Gray
Write-Host ""

Write-Host "4️⃣  Step 4: Fotos (CRÍTICO)" -ForegroundColor White
Write-Host "    └─ Subir 1 imagen de prueba" -ForegroundColor Gray
Write-Host "    └─ VERIFICAR EN CONSOLA:" -ForegroundColor Yellow
Write-Host "       • [DragDropUploader] ✅ Upload successful" -ForegroundColor Gray
Write-Host "       • url debe ser: https://res.cloudinary.com/..." -ForegroundColor Gray
Write-Host "       • status debe ser: 'success'" -ForegroundColor Gray
Write-Host ""

Write-Host "5️⃣  Step 5: Título y Descripción" -ForegroundColor White
Write-Host "    └─ Mínimo 10 chars título, 20 chars descripción" -ForegroundColor Gray
Write-Host ""

Write-Host "6️⃣  Step 6: Preview (VALIDACIÓN VISUAL)" -ForegroundColor White
Write-Host "    └─ LA FOTO DEBE VERSE aquí" -ForegroundColor Yellow
Write-Host "    └─ Iconos (Tag, MapPin, Calendar) deben verse" -ForegroundColor Yellow
Write-Host "    └─ VERIFICAR EN CONSOLA:" -ForegroundColor Yellow
Write-Host "       • 🖼️ AdPreviewCard - Datos recibidos" -ForegroundColor Gray
Write-Host "       • images length debe ser > 0" -ForegroundColor Gray
Write-Host ""

Write-Host "7️⃣  Click en PUBLICAR AVISO" -ForegroundColor White
Write-Host "    └─ VERIFICAR EN CONSOLA:" -ForegroundColor Yellow
Write-Host "       • [PublicarAviso] 📸 uploadedImagesRef.current.length: 1" -ForegroundColor Gray
Write-Host "       • 📦 Enviando a BFF API" -ForegroundColor Gray
Write-Host "       • images array debe tener url y path" -ForegroundColor Gray
Write-Host ""

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🐛 SI HAY ERROR 400:" -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "COPIA Y PEGA los logs de la consola que empiezan con:" -ForegroundColor Yellow
Write-Host "  • [PublicarAviso] 📸 uploadedImagesRef.current.length" -ForegroundColor White
Write-Host "  • 📦 Enviando a BFF API" -ForegroundColor White
Write-Host "  • 📦 Tipo de images" -ForegroundColor White
Write-Host "  • 📦 Primer elemento images" -ForegroundColor White
Write-Host ""
Write-Host "Y pégalos en el chat para diagnóstico preciso" -ForegroundColor Yellow
Write-Host ""
