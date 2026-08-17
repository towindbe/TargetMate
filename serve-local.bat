@echo off
cd /d "%~dp0"
start "TargetMate lokal" "C:\Users\tobiw\AppData\Local\DevTools\node\node.exe" server.js
timeout /t 1 /nobreak >nul
start "" "http://localhost:8080"
echo TargetMate laeuft unter http://localhost:8080
echo Zum Beenden das Fenster "TargetMate lokal" schliessen.
pause
