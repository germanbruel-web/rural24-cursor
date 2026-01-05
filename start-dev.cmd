@echo off
REM Script de inicio para RURAL24 - Desarrollo (CMD)

echo ========================================
echo   RURAL24 - Inicializando servicios
echo ========================================
echo.

REM Verificar puertos con PowerShell
powershell -Command "$port5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if ($port5173) { Stop-Process -Id $port5173.OwningProcess -Force; Write-Host 'Puerto 5173 liberado' -ForegroundColor Green }"

powershell -Command "$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if ($port3000) { Stop-Process -Id $port3000.OwningProcess -Force; Write-Host 'Puerto 3000 liberado' -ForegroundColor Green }"

echo.
echo Iniciando Backend en http://localhost:3000 ...
start "RURAL24-Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Iniciando Frontend en http://localhost:5173 ...
start "RURAL24-Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Servicios iniciados correctamente
echo ========================================
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo ========================================
pause
