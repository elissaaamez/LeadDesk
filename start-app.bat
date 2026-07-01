@echo off
title AI CRM Platform
cd /d "%~dp0"
echo ============================================================
echo   AI CRM Platform
echo   URL:  http://localhost:3000/
echo.
echo   Keep this window OPEN while you use the app.
echo   Closing it (or pressing Ctrl+C) stops the server.
echo ============================================================
echo.

REM Install dependencies the first time only.
if not exist "node_modules" (
  echo Installing dependencies, please wait...
  call npm install
  echo.
)

REM Open the browser a couple of seconds after the server starts.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000/'"

REM Run the server in this window (this is what keeps the app alive).
node server/index.js

echo.
echo Server stopped. Press any key to close this window.
pause >nul
