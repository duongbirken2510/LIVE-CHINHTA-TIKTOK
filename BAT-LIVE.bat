@echo off
chcp 65001 >nul
title Vua Chinh Ta - Dau Truong Tieng Viet 1 vs 2 (Port 4016)
cd /d "%~dp0"

echo ============================================================
echo   VUA CHINH TA (LIVE-CHINHTA-TIKTOK) - CONG 4016
echo   Trang quan tri Admin : http://localhost:4016
echo   Link TikTok Studio   : http://lvh.me:4016/?view=stage
echo ============================================================
echo.

if not exist "node_modules" (
  echo [1/2] Dang cai dat thu vien lan dau...
  call npm install
)

start "" "http://localhost:4016"
call npx tsx server.ts
pause
