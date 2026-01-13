@echo off
title Rural24 Backend - Puerto 3000
cd /d %~dp0
echo.
echo ============================================
echo   RURAL24 BACKEND - Next.js en puerto 3000
echo ============================================
echo.
echo Iniciando servidor...
echo.
call npm run dev
echo.
echo [ERROR] El servidor se detuvo inesperadamente.
pause
