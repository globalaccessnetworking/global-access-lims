@echo off
echo ===================================================
echo    FIXING PM2 & STARTING LIMS
echo ===================================================
echo.
echo [1/5] Force killing all Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo [2/5] Removing corrupt PM2 state...
rmdir /S /Q "C:\Users\Global Access\.pm2" >nul 2>&1

echo.
echo [3/5] Starting LIMS (Fresh State)...
call pm2 start ecosystem.config.js

echo.
echo [4/5] Saving State...
call pm2 save

echo.
echo ===================================================
echo   STATUS CHECK:
echo ===================================================
call pm2 list
echo.
echo If you see 'online' in the status column, it worked!
echo Open http://localhost:5173 to verify.
echo.
pause
