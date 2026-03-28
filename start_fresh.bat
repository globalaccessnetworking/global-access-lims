@echo off
set PM2_HOME=%USERPROFILE%\.pm2_fresh
echo Using PM2_HOME=%PM2_HOME%

echo Killing old processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo Starting PM2...
call pm2 start ecosystem.config.js

echo.
echo ===================================================
echo   SUCCESS! LIMS is running in the background.
echo   - Backend: http://localhost:5002
echo   - Frontend: http://localhost:5174
echo.
echo   You can safely close this window now.
echo ===================================================
pause
