@echo off
chcp 65001 >nul
title 🤖 My Space - Telegram Бот

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🤖 MY SPACE - TELEGRAM БОТ               ║
echo ║                                                              ║
echo ║  Запуск Telegram бота для дневника                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Сохраняем текущую директорию
set ORIGINAL_DIR=%CD%

REM Переходим в папку telegram-services
cd /d "%~dp0telegram-services"

echo 🤖 Запуск Telegram бота My Space...

REM Проверяем наличие .env файла
if not exist "telegram-bot\.env" (
    echo ⚠️ Файл .env не найден!
    echo Пожалуйста, создайте его на основе telegram-bot\.env.example:
    echo 1. Скопируйте telegram-bot\.env.example в telegram-bot\.env
    echo 2. Добавьте ваш TELEGRAM_BOT_TOKEN от @BotFather
    cd "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

REM Устанавливаем зависимости
echo 📦 Проверка зависимостей...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки зависимостей
    cd "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

echo.
echo 🚀 Запуск бота...
echo 💡 Нажмите Ctrl+C для остановки бота
echo.

REM Запускаем простого бота
python start_bot.py

REM Возвращаемся в исходную директорию
cd "%ORIGINAL_DIR%"
pause
