@echo off
chcp 65001 >nul
title Tat Live & Giai phong Port 4016 - Vua Chinh Ta

echo Dang gui lenh tat mem toi Server Vua Chinh Ta (Port 4016)...
powershell -NoProfile -Command "try { Invoke-RestMethod -Method Post -Uri 'http://localhost:4016/api/server/shutdown' -TimeoutSec 3 | Out-Null; Write-Host 'Da gui lenh tat thanh cong!' } catch { Write-Host 'Dang quet tien trinh chiem cong 4016...' }"

timeout /t 1 /nobreak >nul

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4016 " ^| findstr "LISTENING"') do (
  echo Dang giai phong PID %%a tren cong 4016...
  taskkill /F /PID %%a >nul 2>&1
)

echo Hoan tat! Cong 4016 da duoc giai phong hoan toan.
timeout /t 2 >nul
