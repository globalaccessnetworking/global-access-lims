@echo off
echo ===========================================
echo   LIMS PRO - EMERGENCY DIRECT LAUNCH
echo ===========================================
echo.
echo 1. Stopping any lingering LIMS processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo 2. Starting BACKEND (Port 5002)...
start "LIMS Backend (5002)" cmd /k "cd server && node server.js"

echo.
echo 3. Starting FRONTEND (Port 5174)...
start "LIMS Frontend (5174)" cmd /k "cd client && node node_modules/vite/bin/vite.js --port 5174 --strictPort"

echo.
echo ===========================================
echo   SYSTEM LAUNCHED!
echo   - Backend logs are in the "LIMS Backend" window.
echo   - Frontend logs are in the "LIMS Frontend" window.
echo.
echo   Please wait ~10 seconds for startup.
echo   Then access: http://localhost:5174/dashboard
echo ===========================================
pause
