@echo off
title Student Journal PWA

:: Resolve PWA root = parent of this server\ folder
pushd "%~dp0.."
set PWAROOT=%CD%
popd

:: Open Chrome in app-mode after 2 seconds
start "" /B cmd /C "timeout /t 2 /nobreak >nul && start chrome --app=http://localhost:8080 --new-window"

:: Start the server (stays open until Ctrl+C), passing PWA root explicitly
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1" "%PWAROOT%"
pause
