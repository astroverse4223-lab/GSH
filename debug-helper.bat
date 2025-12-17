@echo off
echo 🐛 Debug Helper - Collecting System Info...
echo.

REM Create debug info file
echo # Debug Report - %date% %time% > debug-report.txt
echo. >> debug-report.txt

echo ## System Info >> debug-report.txt
node --version >> debug-report.txt 2>&1
npm --version >> debug-report.txt 2>&1
echo. >> debug-report.txt

echo ## Project Status >> debug-report.txt
echo ### Package.json exists: >> debug-report.txt
if exist package.json (echo ✅ Yes >> debug-report.txt) else (echo ❌ No >> debug-report.txt)

echo ### Node modules exists: >> debug-report.txt
if exist node_modules (echo ✅ Yes >> debug-report.txt) else (echo ❌ No >> debug-report.txt)

echo ### .next folder exists: >> debug-report.txt
if exist .next (echo ✅ Yes >> debug-report.txt) else (echo ❌ No >> debug-report.txt)

echo ## Recent Git Changes >> debug-report.txt
git log --oneline -5 >> debug-report.txt 2>&1

echo ## Process List >> debug-report.txt
tasklist | findstr node >> debug-report.txt 2>&1

echo.
echo 📄 Debug report saved to: debug-report.txt
echo 🔍 Checking for common issues...

REM Check for common problems
if not exist package.json echo ❌ Missing package.json!
if not exist node_modules echo ⚠️ Missing node_modules - run npm install
if exist src\**\dist echo ⚠️ Found dist folders in src - run clean-dist.bat

echo.
echo 🎯 Quick fixes:
echo   npm install           - Install dependencies
echo   clean-dist.bat        - Clean problematic folders
echo   dev-setup.bat         - Full development setup
echo   quick-deploy.bat      - Build and deploy
echo.
pause
