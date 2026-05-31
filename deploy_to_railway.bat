@echo off
setlocal enabledelayedexpansion
title Growth Engine — Railway Deploy
color 0A

echo.
echo ============================================================
echo   Growth Engine — Deploy (slim build, no SWI-Prolog)
echo ============================================================
echo.

:: ── Project token ────────────────────────────────────────────
set RAILWAY_TOKEN=23c56fb7-8db8-420b-b7ce-79625e8a83d0

:: ── Move to project root ─────────────────────────────────────
cd /d D:\mubashir\growthengine

:: ── Resolve railway.cmd path ─────────────────────────────────
for /f "delims=" %%i in ('npm config get prefix') do set NPM_PREFIX=%%i
set RAILWAY=%NPM_PREFIX%\railway.cmd

echo [1/3] Uploading and building...
echo       Logs streaming below. Wait for "Build successful".
echo.
call "%RAILWAY%" up --service growth-engine
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Upload failed. Check logs above.
    pause & exit /b 1
)

echo.
echo [2/3] Generating public URL...
call "%RAILWAY%" domain --service growth-engine
echo.
echo ============================================================
echo   Done! Copy the URL above and share it with your client.
echo ============================================================
echo.
pause
