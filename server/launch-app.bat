@echo off

:: Resolve PWA root = parent of this server\ folder
pushd "%~dp0.."
set PWAROOT=%CD%
popd

:: Check if server is already running
powershell -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1',8080); $c.Close(); exit 0 } catch { exit 1 }"
if %errorLevel% equ 0 (
  :: Server already running — just open browser
  start chrome --app=http://localhost:8080 --new-window
  exit /b
)

:: Start server hidden in background, passing PWA root explicitly
start /B /MIN powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0server.ps1" "%PWAROOT%"

:: Wait for port to open (up to 15 seconds)
set /a TRIES=0
:wait
timeout /t 1 /nobreak >nul
set /a TRIES+=1
powershell -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1',8080); $c.Close(); exit 0 } catch { exit 1 }"
if %errorLevel% neq 0 (
  if %TRIES% lss 15 goto wait
)

:: Open Chrome in app mode (no toolbar, no URL bar)
start chrome --app=http://localhost:8080 --new-window
