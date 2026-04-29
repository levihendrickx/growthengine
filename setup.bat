@echo off
REM ============================================================
REM OmegaClaw / PeTTa - Windows setup script
REM ------------------------------------------------------------
REM This script creates a Python virtual environment and
REM installs the dependencies required by OmegaClaw-Core.
REM
REM Run this from the PeTTa root folder (D:\mubashir\OMEGACLAW)
REM in a regular Command Prompt (cmd.exe).
REM ============================================================

setlocal enableextensions

cd /d "%~dp0"

echo.
echo === Checking for Python ===
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not on your PATH. Install Python 3 from https://www.python.org/downloads/ and re-run this script.
    exit /b 1
)
python --version

echo.
echo === Creating virtual environment in .venv ===
if not exist ".venv" (
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        exit /b 1
    )
) else (
    echo .venv already exists, skipping creation.
)

echo.
echo === Activating virtual environment ===
call ".venv\Scripts\activate.bat"
if errorlevel 1 (
    echo [ERROR] Failed to activate the virtual environment.
    exit /b 1
)

echo.
echo === Upgrading pip ===
python -m pip install --upgrade pip

echo.
echo === Installing CPU-only PyTorch (skip if you want GPU torch) ===
python -m pip install --index-url https://download.pytorch.org/whl/cpu torch
if errorlevel 1 (
    echo [WARN] CPU-only PyTorch install failed; you may need to install torch manually.
)

echo.
echo === Installing OmegaClaw-Core requirements ===
python -m pip install -r ".\repos\OmegaClaw-Core\requirements.txt"
if errorlevel 1 (
    echo [ERROR] Failed to install OmegaClaw-Core requirements.
    exit /b 1
)

echo.
echo === Setup complete ===
echo Next steps:
echo   1. Install SWI-Prolog 9.1.12+ from https://www.swi-prolog.org/download/stable
echo      (make sure swipl.exe is on your PATH)
echo   2. Set OPENAI_API_KEY in your environment.
echo   3. Edit run.bat with your IRC channel name and OMEGACLAW_AUTH_SECRET, then run it.
echo.

endlocal
