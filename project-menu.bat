@echo off
echo 🎮 Project Menu - Choose Your Action
echo.
echo 1. 🚀 Start Development (dev-setup.bat)
echo 2. ⚡ Quick Deploy (quick-deploy.bat)
echo 3. 🩺 Health Check (health-check.bat)
echo 4. 🐛 Debug Helper (debug-helper.bat)
echo 5. 📝 Git Commit (git-commit.bat)
echo 6. 🧹 Clean Project (clean-dist.bat)
echo 7. 📦 Install Dependencies (npm install)
echo 8. 🌐 Open Live Site
echo 9. 📁 Open Local Site
echo 0. ❌ Exit
echo.
set /p "choice=Enter your choice (0-9): "

if "%choice%"=="1" call dev-setup.bat
if "%choice%"=="2" call quick-deploy.bat
if "%choice%"=="3" call health-check.bat
if "%choice%"=="4" call debug-helper.bat
if "%choice%"=="5" call git-commit.bat
if "%choice%"=="6" call clean-dist.bat
if "%choice%"=="7" npm install
if "%choice%"=="8" start https://realmoflegends.info
if "%choice%"=="9" start http://localhost:3000
if "%choice%"=="0" exit

echo.
echo Press any key to return to menu...
pause >nul
cls
goto :eof
