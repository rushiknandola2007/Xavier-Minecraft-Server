@echo off
cd /d "%~dp0web-panel"
start "" "node_modules\electron\dist\electron.exe" .
exit