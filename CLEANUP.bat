@echo off
chcp 65001 >nul
title 🧹 My Space - Очистка проекта

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                🧹 MY SPACE - ОЧИСТКА ПРОЕКТА              ║
echo ║                                                              ║
echo ║  Удаление временных и неиспользуемых файлов              ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo ⚠️ Внимание! Будут удалены:
echo    📁 Архивные папки (archive/, telegram-services/)
echo    🗑️ Временные файлы (*.log, *.tmp, ngrok.exe)
echo    📋 Дубликаты документации
echo    📱 APK файлы
echo    🔧 Временные скрипты
echo.

echo ❓ Вы уверены что хотите удалить все лишние файлы?
set /p confirm="Продолжить? (y/N): "

if /i "%confirm%" neq "y" (
    echo ❌ Очистка отменена
    pause
    exit /b 0
)

echo.
echo 🧹 Начинаю очистку...
node cleanup-project.js

echo.
echo ✅ Очистка завершена!
echo 💡 Проект готов к работе
echo.
pause
