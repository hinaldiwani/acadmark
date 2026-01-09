@echo off
echo Restarting MariaDB...
net stop MariaDB
timeout /t 3 /nobreak
net start MariaDB
echo.
echo MariaDB restarted!
pause
