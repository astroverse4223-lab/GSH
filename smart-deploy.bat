@echo off
setlocal enabledelayedexpansion

echo 🚀 Realm of Legends Smart Deploy
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

REM Create a simple hash of files to detect changes
set LAST_DEPLOY_FILE=.last-deploy
set TEMP_HASH_FILE=temp_hash.txt

REM Get current timestamp as a simple change indicator
for %%F in (src\*.tsx src\*.ts src\*.js src\*.css *.json) do (
    echo %%~tF >> %TEMP_HASH_FILE%
)

if exist %LAST_DEPLOY_FILE% (
    fc %LAST_DEPLOY_FILE% %TEMP_HASH_FILE% >nul 2>&1
    if !errorlevel! equ 0 (
        echo 📝 No changes detected since last deployment
        echo 🎯 Your site is already up to date at: https://realmoflegends.info
        del %TEMP_HASH_FILE%
        pause
        exit /b 0
    )
)

echo 📦 Changes detected, deploying to Vercel...
echo.

REM Deploy to production
echo 🚀 Running Vercel deployment...
vercel --prod --yes > temp_output.txt 2>&1
set DEPLOY_EXIT_CODE=!errorlevel!

if !DEPLOY_EXIT_CODE! equ 0 (
    for /f "tokens=*" %%i in ('findstr "https://.*vercel.app" temp_output.txt') do set DEPLOYMENT_URL=%%i
    
    echo ✅ Deployment successful!
    echo 🔗 Deployment URL: !DEPLOYMENT_URL!
    echo.
    
    echo 🌐 Assigning custom domain alias...
    vercel alias "!DEPLOYMENT_URL!" realmoflegends.info
    
    if !errorlevel! equ 0 (
        echo ✅ Domain alias assigned successfully!
        echo 🎯 Your site is live at: https://realmoflegends.info
        
        REM Save the current hash
        move %TEMP_HASH_FILE% %LAST_DEPLOY_FILE%
        echo 📝 Deployment hash saved for future change detection
    ) else (
        echo ⚠️  Domain alias assignment failed, but deployment is still successful
        echo 🔗 Access your site at: !DEPLOYMENT_URL!
    )
) else (
    echo ❌ Deployment failed!
    type temp_output.txt
    
    findstr "try again in" temp_output.txt >nul
    if !errorlevel! equ 0 (
        echo.
        echo 💡 You've hit Vercel's free tier limit (100 deployments/day)
        echo ⏰ Wait for the cooldown or consider upgrading to Pro plan
        echo.
        echo 🛠️  Alternative options:
        echo    • Wait for the rate limit to reset
        echo    • Only deploy when you have significant changes
        echo    • Use 'vercel dev' for local development testing
    )
    
    del %TEMP_HASH_FILE%
    del temp_output.txt
    pause
    exit /b 1
)

del temp_output.txt
echo.
echo 🎉 Smart deployment complete!
pause
