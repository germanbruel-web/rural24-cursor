@echo off
REM ===================================================
REM   Rural24 - Inicio Completo (Backend + Frontend)
REM ===================================================
echo.
echo ================================================
echo    Rural24 - Full Stack Development
echo ================================================
echo.
echo [*] Limpiando procesos anteriores...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo [OK] Procesos limpiados
echo.
echo [*] Iniciando Backend y Frontend...
echo.

cd /d "%~dp0"
start "Rural24 Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Rural24 Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [OK] Servidores iniciados en nueva ventana
echo.
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3000
echo.
echo    Pagina de pruebas API: http://localhost:5173/#/api-test
echo.
echo ================================================
timeout /t 5
