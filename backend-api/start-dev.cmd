@echo off
echo.
echo ========================================
echo   Rural24 Backend API - Fastify
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Starting Fastify server with hot reload...
echo.

npx tsx watch --clear-screen=false src/server.ts

pause
