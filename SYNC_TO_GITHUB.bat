@echo off
chcp 65001 >nul
title 🔄 My Space - Синхронизация

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              🔄 MY SPACE - СИНХРОНИЗАЦИЯ                  ║
echo ║                                                              ║
echo ║  Автоматическая отправка изменений в GitHub                   ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo 🔄 Синхронизация с GitHub...
node sync-to-github.js sync

echo.
echo ✅ Готово!
echo 💡 Для авто-синхронизации каждые 5 минут:
echo    node sync-to-github.js setup
echo.
pause
