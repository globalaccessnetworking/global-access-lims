@echo off
:: Set a fresh PM2 home to avoid EPERM on default folder
set PM2_HOME=%USERPROFILE%\.pm2_fresh

:: Kill any existing node processes to ensure clean ports
taskkill /F /IM node.exe /T >nul 2>&1

:: Start the ecosystem
call pm2 resurrect >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    call pm2 start ecosystem.config.js
) else (
    call pm2 start ecosystem.config.js
)

:: Save the list
call pm2 save
