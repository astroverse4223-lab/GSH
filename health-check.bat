@echo off
echo 🩺 Health Check - Testing Everything...
echo.

set "errors=0"

REM Test 1: Dependencies
echo 🔍 Checking dependencies...
if not exist node_modules (
    echo ❌ Missing node_modules
    set /a errors+=1
) else (
    echo ✅ Dependencies installed
)

REM Test 2: Build
echo 🔨 Testing build...
npm run build >nul 2>&1
if errorlevel 1 (
    echo ❌ Build failed
    set /a errors+=1
) else (
    echo ✅ Build successful
)

REM Test 3: Environment files
echo 🔐 Checking environment...
if not exist .env.local (
    echo ⚠️ Missing .env.local
    set /a errors+=1
) else (
    echo ✅ Environment configured
)

REM Test 4: Database connection
echo 🗄️ Testing database...
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('✅ Database connected')).catch(() => console.log('❌ Database connection failed')).finally(() => prisma.$disconnect());" 2>nul
if errorlevel 1 (
    set /a errors+=1
)

REM Test 5: Clean state
echo 🧹 Checking for issues...
if exist src\**\dist (
    echo ⚠️ Found problematic dist folders
    set /a errors+=1
)

echo.
if %errors% == 0 (
    echo 🎉 All checks passed! Your project is healthy.
    echo 🚀 Ready to deploy with: quick-deploy.bat
) else (
    echo ⚠️ Found %errors% issues. Run debug-helper.bat for more info.
)

echo.
pause
