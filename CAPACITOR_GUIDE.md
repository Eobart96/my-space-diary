# Capacitor Integration Guide

## Overview
Capacitor интегрирован в ваш MySpace Diary проект для гибридной разработки.

## Установленные пакеты
- @capacitor/core
- @capacitor/cli  
- @capacitor/android

## Новые скрипты в package.json
```bash
npm run cap:build      # Собрать web и синхронизировать с Android
npm run cap:sync        # Синхронизировать web assets с Android
npm run cap:open:android # Открыть Android Studio
npm run cap:run:android  # Запустить на Android устройстве/эмуляторе
```

## Разработка
1. Запустите dev сервер:
```bash
npm run dev
```

2. Для тестирования на Android:
```bash
npm run cap:sync
npm run cap:run:android
```

3. Для production сборки:
```bash
npm run cap:build
```

## GitHub Actions
- Автоматически собирает web assets
- Синхронизирует с Android через Capacitor
- Собирает APK/AAB файлы

## Конфигурация
- `capacitor.config.json` - основные настройки
- `src/capacitor/index.ts` - platform-specific код
- Dev сервер: `http://localhost:5173`
- Android emulator: `http://10.0.2.2:5173`

## Особенности
- Сохранен существующий Android код
- WebView интеграция с Capacitor
- Поддержка hot reload в разработке
- Автоматическая синхронизация assets
