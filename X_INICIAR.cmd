@echo off
REM ============================================================
REM   Rural24 - Inicio Garantizado (Arquitectura Robusta)
REM ============================================================
REM
REM   Este script GARANTIZA:
REM   1. Puertos 3000 y 5173 libres
REM   2. Servidores visibles en ventanas separadas
REM   3. Logs en tiempo real
REM   4. Sin procesos zombie
REM
REM   Uso: Doble click o ejecutar desde cualquier terminal
REM ============================================================

color 0A
echo.
echo ============================================================
echo    Rural24 - Sistema de Inicio Robusto
echo ============================================================
echo.

cd /d "%~dp0"

REM ============================================================
REM  FASE 1: LIMPIEZA DE PUERTOS (Fuerza bruta garantizada)
REM ============================================================
echo [1/4] Limpiando puertos 3000 y 5173...
echo.

REM Matar todos los procesos Node.js
taskkill /F /IM node.exe >nul 2>&1

REM Buscar y matar procesos específicos en puerto 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Buscar y matar procesos específicos en puerto 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo       OK - Puertos liberados
echo.

REM ============================================================
REM  FASE 2: INICIAR BACKEND (Ventana separada)
REM ============================================================
echo [2/4] Iniciando Backend Fastify (puerto 3000)...
echo.

start "Rural24 Backend (puerto 3000)" cmd /k "cd /d %~dp0backend-api && npm run dev"

timeout /t 5 /nobreak >nul
echo       OK - Backend iniciado
echo.

REM ============================================================
REM  FASE 3: INICIAR FRONTEND (Ventana separada)
REM ============================================================
echo [3/4] Iniciando Frontend Vite (puerto 5173)...
echo.

start "Rural24 Frontend (puerto 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul
echo       OK - Frontend iniciado
echo.

REM ============================================================
REM  FASE 4: VALIDACION (Verificar que estan escuchando)
REM ============================================================
echo [4/4] Validando que los puertos esten activos...
echo.

timeout /t 3 /nobreak >nul

netstat -an | findstr ":3000.*LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo       [OK] Backend en puerto 3000 - ACTIVO
) else (
    echo       [!!] Backend NO responde - Revisar ventana de backend
)

netstat -an | findstr ":5173.*LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo       [OK] Frontend en puerto 5173 - ACTIVO
) else (
    echo       [!!] Frontend NO responde - Revisar ventana de frontend
)

echo.
echo ============================================================
echo    SISTEMA INICIADO
echo ============================================================
echo.
echo    Backend:  http://localhost:3000
echo    Frontend: http://localhost:5173
echo    API Test: http://localhost:5173/#/api-test
echo.
echo    Ventanas abiertas:
echo      - Backend (puerto 3000) - Logs en tiempo real
echo      - Frontend (puerto 5173) - Logs en tiempo real
echo.
echo    Para detener: Cerrar las ventanas de backend/frontend
echo                   o ejecutar: taskkill /F /IM node.exe
echo.
echo ============================================================
echo.

timeout /t 10
exit
