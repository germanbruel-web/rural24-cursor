@echo off
REM ============================================================
REM   Rural24 - Detener Todo (Limpieza Total)
REM ============================================================
color 0C
echo.
echo ============================================================
echo    Rural24 - Deteniendo Servidores
echo ============================================================
echo.

echo [*] Matando todos los procesos Node.js...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo.
echo [*] Liberando puerto 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)

echo [*] Liberando puerto 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 1 /nobreak >nul

echo.
echo ============================================================
echo    TODOS LOS SERVIDORES DETENIDOS
echo ============================================================
echo.
echo    Puertos 3000 y 5173 liberados
echo    Procesos Node eliminados
echo.
timeout /t 5
