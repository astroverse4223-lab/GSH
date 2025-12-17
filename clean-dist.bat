@echo off
echo 🧹 Cleaning up dist folders...
echo.

REM Count existing dist folders first
set /a DIST_COUNT=0
for /d /r "src" %%d in (dist) do if exist "%%d" set /a DIST_COUNT+=1
for /d /r "pages" %%d in (dist) do if exist "%%d" set /a DIST_COUNT+=1
for /d /r "components" %%d in (dist) do if exist "%%d" set /a DIST_COUNT+=1
for /d /r "lib" %%d in (dist) do if exist "%%d" set /a DIST_COUNT+=1
if exist "dist" set /a DIST_COUNT+=1

if %DIST_COUNT% equ 0 (
    echo ✅ No dist folders found - project is already clean!
    pause
    exit /b 0
)

echo 🔍 Found %DIST_COUNT% dist folders to remove
echo.

echo 🗑️  Removing dist folders...
if exist "dist" rmdir /s /q "dist" >nul 2>&1
for /d /r "src" %%d in (dist) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1
for /d /r "pages" %%d in (dist) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1
for /d /r "components" %%d in (dist) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1
for /d /r "lib" %%d in (dist) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1

echo ✅ Cleanup complete! Removed %DIST_COUNT% dist folders
echo.
echo 💡 These folders were causing TypeScript build failures
echo 🚀 Your project is now ready for deployment
pause
