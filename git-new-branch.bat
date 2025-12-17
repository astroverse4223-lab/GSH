@echo off
:: Create New Branch Script
:: Helps you create and switch to a new branch

echo.
echo ========================================
echo   Create New Branch
echo ========================================
echo.

:: Show current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i
echo Current branch: %current_branch%
echo.

:: Ask for new branch name
set /p branch_name="Enter new branch name (e.g., 'feature-name' or 'fix-bug'): "

if "%branch_name%"=="" (
    echo ERROR: Branch name cannot be empty!
    pause
    exit /b 1
)

echo.
echo Creating and switching to branch: %branch_name%
echo.

:: Create and switch to new branch
git checkout -b %branch_name%

if errorlevel 1 (
    echo.
    echo ERROR: Failed to create branch!
    echo The branch might already exist.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS!
echo ========================================
echo You are now on branch: %branch_name%
echo.
echo Next steps:
echo 1. Make your changes
echo 2. Run git-update.bat to push your changes
echo.
pause
