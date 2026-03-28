@echo off
set PM2_HOME=%USERPROFILE%\.pm2_v3
echo Using Fresh PM2 Environment: %PM2_HOME%

echo 1. Cleaning up old processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo 2. Installing PM2 locally if needed...
if not exist "%PM2_HOME%" mkdir "%PM2_HOME%"

echo 3. Starting LIMS Ecosystem...
call pm2 start D:\Bacteriophage_LIMS\ecosystem.config.js --no-daemon

pause
