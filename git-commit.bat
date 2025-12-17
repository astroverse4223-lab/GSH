@echo off
setlocal enabledelayedexpansion

echo 🔄 Git Commit Helper...
echo.

REM Check if git repo exists
if not exist .git (
    echo ❌ Not a git repository!
    echo Initialize with: git init
    pause
    exit /b 1
)

REM Show current status
echo 📊 Current Status:
git status --short

REM Check for changes
git diff --quiet
if !errorlevel! == 0 (
    echo ✅ No changes to commit
    pause
    exit /b 0
)

echo.
echo 📝 Enter commit message (or press Enter for auto-message):
set /p "message="

if "!message!"=="" (
    REM Generate auto message based on changed files
    set "message=Update: "
    for /f "tokens=*" %%i in ('git diff --name-only --cached 2^>nul') do (
        set "message=!message!%%i "
    )
    if "!message!"=="Update: " (
        for /f "tokens=*" %%i in ('git diff --name-only 2^>nul') do (
            set "message=!message!%%i "
        )
    )
    if "!message!"=="Update: " set "message=Auto commit - %date%"
)

echo.
echo 🚀 Committing with message: "!message!"

REM Add all changes and commit
git add .
git commit -m "!message!"

REM Ask about pushing
echo.
set /p "push=Push to remote? (y/N): "
if /i "!push!"=="y" (
    echo 📤 Pushing to remote...
    git push
)

echo ✅ Done!
pause
