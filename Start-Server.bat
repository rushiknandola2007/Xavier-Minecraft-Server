@echo off
setlocal
cd /d "%~dp0web-panel"

:: Launch the Electron application silently (direct binary, detached — no console window)
if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
) else (
    call npm start
)
