@echo off
chcp 65001 >nul
title 📱 My Space - Публичный APK

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                📱 MY SPACE - ПУБЛИЧНЫЙ APK                    ║
echo ║                                                              ║
echo ║  Использование бесплатных сервисов для хостинга              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔧 Проверка файлов...
if not exist "public\icons\icon-512x512.png" (
    echo ❌ Иконка не найдена! Запустите:
    echo    node generate-icons.js
    pause
    exit /b 1
)

echo ✅ Все файлы на месте
echo.

echo 🌐 Варианты публичных URL:
echo.
echo 1️⃣ **GitHub Pages (рекомендуется):**
echo    - Бесплатно и навсегда
echo    - HTTPS автоматический
echo    - Простая настройка
echo.
echo 2️⃣ **Netlify:**
echo    - Бесплатно
echo    - Авто-деплой
echo    - HTTPS
echo.
echo 3️⃣ **Vercel:**
echo    - Бесплатно
echo    - Быстрый
echo    - HTTPS
echo.

echo 📋 Создание APK с GitHub Pages:
echo.
echo 1️⃣ **Создайте репозиторий на GitHub**
echo    - Название: my-space-diary
echo    - Публичный
echo.
echo 2️⃣ **Загрузите файлы в репозиторий**
echo    - Все файлы проекта
echo    - Игнорируйте: node_modules, .git
echo.
echo 3️⃣ **Включите GitHub Pages**
echo    - Settings → Pages
echo    - Source: Deploy from a branch
echo    - Branch: main
echo    - Folder: /root
echo.
echo 4️⃣ **Получите URL**
echo    - https://username.github.io/my-space-diary
echo.
echo 5️⃣ **Создайте APK**
echo    - Откройте: https://www.pwa2apk.com/
echo    - URL: https://username.github.io/my-space-diary
echo    - App Name: My Space
echo    - Package: com.myspace.app
echo    - Icon: icon-512x512.png
echo.

echo 🚀 Автоматическая настройка GitHub Pages...
echo.

REM Создаем .gitignore если нет
if not exist ".gitignore" (
    echo node_modules > .gitignore
    echo .git >> .gitignore
    echo dist >> .gitignore
    echo *.apk >> .gitignore
    echo ✅ Создан .gitignore
)

REM Создаем README для GitHub
echo # My Space - Личный дневник > README.md
echo. >> README.md
echo 🌌 Ваша космическая вселенная мыслей >> README.md
echo. >> README.md
echo ## 🚀 Демо >> README.md
echo https://username.github.io/my-space-diary >> README.md
echo. >> README.md
echo ## 📱 APK >> README.md
echo Скачать APK: [MySpace.apk](./MySpace.apk) >> README.md

echo ✅ README.md создан
echo.

echo 📋 Следующие шаги:
echo 1. Создайте репозиторий на GitHub
echo 2. Загрузите файлы проекта
echo 3. Включите GitHub Pages
echo 4. Используйте полученный URL для создания APK
echo.

echo 🌐 Открытие GitHub...
start https://github.com/new

echo 🌐 Открытие PWA2APK...
timeout /t 2 /nobreak >nul
start https://www.pwa2apk.com/

echo.
echo 💡 После настройки GitHub Pages ваш сайт будет доступен по URL:
echo    https://username.github.io/my-space-diary
echo.
pause
