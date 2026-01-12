@echo off
chcp 65001 >nul
title 🔄 My Space - Синхронизация с GitHub

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║            🔄 MY SPACE - GITHUB СИНХРОНИЗАЦИЯ           ║
echo ║                                                              ║
echo ║  Автоматическая отправка в ваш репозиторий                ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo 📍 Репозиторий: https://github.com/Eobart96/my-space-diary
echo.

echo 🔧 Выберите действие:
echo.
echo 1️⃣  🔄 Синхронизировать сейчас
echo 2️⃣  ⏰ Включить авто-синхронизацию
echo 3️⃣  👀 Отслеживать изменения файлов
echo 4️⃣  🆕 Инициализировать репозиторий
echo 5️⃣  📊 Показать статус
echo.

set /p choice="Ваш выбор (1-5): "

if "%choice%"=="1" (
    echo 🔄 Синхронизация...
    node auto-sync-github.js sync
    goto end
)

if "%choice%"=="2" (
    echo ⏰ Включение авто-синхронизации...
    node auto-sync-github.js auto
    goto end
)

if "%choice%"=="3" (
    echo 👀 Отслеживание изменений...
    node auto-sync-github.js watch
    goto end
)

if "%choice%"=="4" (
    echo 🆕 Инициализация репозитория...
    node auto-sync-github.js init
    goto end
)

if "%choice%"=="5" (
    echo 📊 Проверка статуса...
    node auto-sync-github.js status
    goto end
)

echo ❌ Неверный выбор
pause
exit /b 1

:end
echo.
echo ✅ Операция завершена!
echo 💡 Ваш проект доступен: https://Eobart96.github.io/my-space-diary
echo.
pause
