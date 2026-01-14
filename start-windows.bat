@echo off
echo Starting MySpace Sync Engine...
echo.

REM Создаем директорию для данных
if not exist "sync-data" mkdir sync-data

REM Запускаем Go sync engine
start "MySpace Sync Engine" cmd /k "cd /d %~dp0sync-engine && myspace-sync-windows.exe -data-dir ../sync-data -device-name windows-pc"

REM Ждем 2 секунды для запуска engine
timeout /t 2 /nobreak >nul

REM Запускаем React приложение
echo Starting React application...
start "MySpace App" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo MySpace Diary is starting...
echo Sync Engine: http://localhost:8080
echo Web App: http://localhost:5173
echo.
pause
