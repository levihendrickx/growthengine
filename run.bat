@echo off
REM ============================================================
REM OmegaClaw / PeTTa - Windows run script
REM ------------------------------------------------------------
REM Edit the variables below before running. This script is the
REM Windows equivalent of run.sh that ships with PeTTa.
REM ============================================================

setlocal enableextensions

cd /d "%~dp0"

REM ---- USER CONFIG ------------------------------------------------------
REM IRC channel the agent will join on QuakeNet (must start with #)
set "IRC_CHANNEL=#mubashirtest"

REM Shared secret used by `auth <secret>` to claim ownership of the agent.
set "OMEGACLAW_AUTH_SECRET=ABCDEFGHI123456789"

REM LLM provider. You picked OpenAI during setup.
set "PROVIDER=OpenAI"

REM Embedding provider: Local (sentence-transformers) or OpenAI.
set "EMBEDDING_PROVIDER=Local"
REM ----------------------------------------------------------------------

if "%OPENAI_API_KEY%"=="" (
    echo [ERROR] OPENAI_API_KEY is not set in the environment.
    echo Set it for this shell with:    set OPENAI_API_KEY=sk-...
    echo Or persistently with:           setx OPENAI_API_KEY "sk-..."
    exit /b 1
)

where swipl >nul 2>nul
if errorlevel 1 (
    echo [ERROR] swipl is not on your PATH. Install SWI-Prolog 9.1.12+ from
    echo         https://www.swi-prolog.org/download/stable
    exit /b 1
)

if exist ".venv\Scripts\activate.bat" (
    call ".venv\Scripts\activate.bat"
) else (
    echo [WARN] .venv not found. Run setup.bat first if you haven't.
)

echo.
echo Starting OmegaClaw...
echo   provider           = %PROVIDER%
echo   embeddingprovider  = %EMBEDDING_PROVIDER%
echo   IRC_channel        = %IRC_CHANNEL%
echo.

swipl --stack_limit=8g -q -s "src\main.pl" -- "run.metta" provider=%PROVIDER% embeddingprovider=%EMBEDDING_PROVIDER% IRC_channel="%IRC_CHANNEL%"

endlocal
