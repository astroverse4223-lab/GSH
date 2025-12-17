@echo off
echo 🔧 Quick Fix & Deploy...
echo.

REM Kill any running processes
taskkill /f /im node.exe >nul 2>&1

REM Clean everything
call clean-dist.bat
if exist .next rmdir /s /q .next

REM Quick build test
echo 🔨 Testing build...
npm run build
if errorlevel 1 (
    echo ❌ Build failed! Check errors above.
    pause
    exit /b 1
)

REM Deploy if build succeeds
echo ✅ Build successful! Deploying...
npm run deploy:auto

echo.
echo 🎉 Done! Your site is live at: https://realmoflegends.info
pause
