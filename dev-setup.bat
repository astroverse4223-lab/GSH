@echo off
echo 🚀 Starting Development Environment...
echo.

REM Kill any existing node processes
echo 🔪 Killing existing Node processes...
taskkill /f /im node.exe >nul 2>&1

REM Clean up any problematic files
echo 🧹 Cleaning up...
call clean-dist.bat

REM Clear Next.js cache
echo 🗑️ Clearing Next.js cache...
if exist .next rmdir /s /q .next

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Start development server
echo 🎯 Starting development server...
echo 📍 Your site will be available at: http://localhost:3000
echo.
npm run dev
