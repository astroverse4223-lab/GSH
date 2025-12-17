@echo off
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set timestamp=%timestamp: =0%
xcopy /E /I /Y . "..\GamerSocialSite_Backup_%timestamp%"
echo Backup completed: GamerSocialSite_Backup_%timestamp%
pause
