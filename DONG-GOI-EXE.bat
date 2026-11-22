@echo off
chcp 65001 >nul
title Dong Goi Bo Cai .EXE 1-Click - Vua Chinh Ta (LIVE-CHINHTA-TIKTOK)
cd /d "%~dp0"

echo ============================================================
echo   DANG DONG GOI BO CAI .EXE: VUA CHINH TA (v1.0)
echo ============================================================
echo.

call node build-installer.mjs
pause
