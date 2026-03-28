@echo off
echo ===================================================
echo   Starting LIMS in Background (Persistent Mode)
echo ===================================================

echo.
echo [1/4] Stopping any conflict processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo [2/4] Resetting PM2...
call pm2 kill >nul 2>&1
call pm2 delete all >nul 2>&1

echo.
echo [3/4] Starting Service...
call pm2 start ecosystem.config.js

echo.
echo [4/4] Saving State...
call pm2 save

echo.
echo ===================================================
echo   SUCCESS! LIMS is running in the background.
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:5173
echo.
echo   You can safely close this window now.
echo ===================================================
pause
