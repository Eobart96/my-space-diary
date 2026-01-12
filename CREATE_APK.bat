@echo off
chcp 65001 >nul
title 📱 My Space - Создание APK

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                📱 MY SPACE - СОЗДАНИЕ APK                    ║
echo ║                                                              ║
echo ║  Автоматическая генерация Android приложения                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Проверка файлов...
if not exist "public\icons\icon-512x512.png" (
    echo ❌ Иконка не найдена! Сначала запустите:
    echo    node generate-icons.js
    pause
    exit /b 1
)

if not exist "public\manifest.json" (
    echo ❌ Manifest не найден!
    pause
    exit /b 1
)

echo ✅ Все файлы на месте
echo.

echo 🌐 Проверка работы сайта...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Сайт не запущен! Запустите:
    echo    npm run dev
    pause
    exit /b 1
)

echo ✅ Сайт работает
echo.

echo 📱 Открытие PWA2APK...
echo.
echo 📋 Данные для ввода:
echo    📍 URL: http://localhost:5173
echo    📱 App Name: My Space
echo    📦 Package Name: com.myspace.app
echo    🎨 Icon: public\icons\icon-512x512.png
echo.

timeout /t 2 /nobreak >nul

REM Открываем PWA2APK
start https://www.pwa2apk.com/

echo.
echo 🔄 Ожидание создания APK...
echo 💡 После создания APK будет загружен в папку проекта
echo.

REM Ждем 5 секунд
timeout /t 5 /nobreak >nul

echo 📥 Проверка загрузки...
:check_apk
if exist "MySpace.apk" (
    echo ✅ APK файл создан: MySpace.apk
    echo 📊 Размер: 
    for %%I in (MySpace.apk) do echo %%~zI байт
    echo.
    echo 📲 Для установки на Android:
    echo    1. Перетащите MySpace.apk на телефон
    echo    2. Разрешите установку из неизвестных источников
    echo    3. Нажмите "Установить"
    echo.
    pause
    exit /b 0
)

echo ⏳ Ожидание APK файла...
timeout /t 10 /nobreak >nul
goto check_apk
