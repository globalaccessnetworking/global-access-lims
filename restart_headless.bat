@echo off
set PM2_HOME=%USERPROFILE%\.pm2_fresh
echo Killing old processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting PM2...
call pm2 start ecosystem.config.js
echo Saving PM2 state...
call pm2 save
echo RESTART_COMPLETE
