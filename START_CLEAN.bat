@echo off
chcp 65001 >nul
title 🚀 My Space - Чистый запуск

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 MY SPACE - ЧИСТЫЙ ЗАПУСК                ║
echo ║                                                              ║
echo ║  Запуск веб-приложения без Telegram бота                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🌐 Запуск веб-приложения...
call app-scripts\RUN_PROJECT.bat

echo.
echo ✅ My Space запущен!
echo 📍 Откройте: http://localhost:5173
echo.
pause
