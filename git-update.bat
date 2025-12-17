@echo off
:: GitHub Update Script - Easy way to push your changes
:: Created for beginners to GitHub

echo.
echo ========================================
echo   GitHub Update Helper
echo ========================================
echo.

:: Show what changed
echo Checking for changes...
echo.
git status --short
echo.

:: Ask for commit message
set /p commit_msg="Enter a description of your changes: "
if "%commit_msg%"=="" set commit_msg=Update code

echo.
echo ========================================
echo Step 1: Staging all changes...
echo ========================================
git add .

echo.
echo ========================================
echo Step 2: Committing changes...
echo ========================================
git commit -m "%commit_msg%"

if errorlevel 1 (
    echo.
    echo ERROR: Commit failed!
    pause
    exit /b 1
)

:: Get current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i

echo.
echo ========================================
echo Step 3: Pushing to GitHub...
echo ========================================
echo Current branch: %current_branch%
echo.

git push origin %current_branch%

if errorlevel 1 (
    echo.
    echo ERROR: Push failed!
    echo This might be your first push on this branch.
    echo Trying with --set-upstream...
    git push --set-upstream origin %current_branch%
)

if errorlevel 1 (
    echo.
    echo Push failed! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS!
echo ========================================
echo Your changes have been pushed to GitHub
echo Branch: %current_branch%
echo.
pause
