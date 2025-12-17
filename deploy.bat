@echo off
echo 🚀 Deploying Realm of Legends...
echo.

REM Clean up dist folders that cause build issues
echo 🧹 Cleaning up dist folders...
if exist "dist" rmdir /s /q "dist" >nul 2>&1
for /d /r "src" %%d in (dist) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1
for /d /r "pages" %%d in (dist) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1
for /d /r "components" %%d in (dist) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1
for /d /r "lib" %%d in (dist) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1
echo ✅ Dist folders cleaned
echo.

echo 📦 Building and deploying to Vercel...
for /f "tokens=*" %%i in ('vercel --prod --yes') do set DEPLOYMENT_URL=%%i

if %errorlevel% equ 0 (
    echo ✅ Deployment successful!
    echo 🔗 Deployment URL: %DEPLOYMENT_URL%
    echo.
    
    echo 🌐 Assigning custom domain alias...
    vercel alias "%DEPLOYMENT_URL%" realmoflegends.info
    
    if %errorlevel% equ 0 (
        echo ✅ Domain alias assigned successfully!
        echo 🎯 Your site is live at: https://realmoflegends.info
    ) else (
        echo ⚠️  Domain alias assignment failed, but deployment is still successful
        echo 🔗 Access your site at: %DEPLOYMENT_URL%
    )
) else (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment complete!
pause
