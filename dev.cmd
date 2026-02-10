@echo off
REM Quick dev start — bypasses turbo/npm overhead (10 processes → 3)
echo [rural24] Starting backend + frontend...

REM Kill any existing node servers on our ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3001 :5173"') do taskkill /PID %%a /F >nul 2>&1

REM Clean stale Next.js lock
if exist backend\.next\dev\lock del /f backend\.next\dev\lock

REM Start backend (Next.js on 3001)
start "rural24-backend" cmd /c "cd backend && set PORT=3001 && npx next dev --hostname 0.0.0.0"

REM Start frontend (Vite on 5173)  
start "rural24-frontend" cmd /c "cd frontend && npx vite --port 5173"

echo [rural24] Servers starting...
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
timeout /t 3 >nul
start http://localhost:5173
