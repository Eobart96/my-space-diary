# 📦 Инструкции по сборке и развертыванию

## 🖥️ Сборка для ПК (Windows/Linux/macOS)

### Требования
- Go 1.21+
- Node.js 16+
- Git

### Шаг 1: Сборка Go Sync Engine

```bash
# Переходим в директорию sync-engine
cd sync-engine

# Скачиваем зависимости
go mod tidy

# Собираем бинарник
go build -o myspace-sync ./cmd/server

# Запускаем для теста
./myspace-sync -data-dir ./data -device-name "my-pc"
```

### Шаг 2: Сборка React приложения

```bash
# Переходим в корень проекта
cd ..

# Устанавливаем зависимости
npm install

# Собираем production версию
npm run build

# Запускаем локальный сервер для разработки
npm run dev
```

### Шаг 3: Запуск полного решения

```bash
# Терминал 1: Запускаем Go sync engine
./sync-engine/myspace-sync -data-dir ./sync-data -device-name "my-pc"

# Терминал 2: Запускаем React приложение
npm run dev
```

---

## 📱 Сборка для Android

### Требования
- Android Studio
- Android SDK (API 24+)
- Go 1.21+
- NDK (Native Development Kit)

### Шаг 1: Сборка Go библиотеки для Android

```bash
# Устанавливаем переменные окружения
export ANDROID_NDK_HOME=/path/to/android-ndk
export GOOS=android
export GOARCH=arm64

# Скачиваем зависимости
cd sync-engine
go mod tidy

# Собираем .so библиотеку
go build -buildmode=c-shared -o libmyspace-sync.so ./cmd/server

# Копируем в Android проект
cp libmyspace-sync.h ../android/app/src/main/jniLibs/arm64-v8a/
cp libmyspace-sync.so ../android/app/src/main/jniLibs/arm64-v8a/
```

### Шаг 2: Настройка Android проекта

```bash
# Переходим в директорию Android
cd ../android

# Открываем в Android Studio
# или используем командную строку:
./gradlew assembleDebug
```

### Шаг 3: Разрешения в AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### Шаг 4: Сборка APK

```bash
# Debug версия
./gradlew assembleDebug

# Release версия
./gradlew assembleRelease
```

---

## 🐳 Docker развертывание

### Dockerfile для Go Sync Engine

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY sync-engine/go.mod sync-engine/go.sum ./
RUN go mod download

COPY sync-engine/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o myspace-sync ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/myspace-sync .
COPY --from=builder /app/web/build ./web

EXPOSE 8080

CMD ["./myspace-sync"]
```

### Запуск через Docker Compose

```yaml
version: '3.8'
services:
  sync-engine:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/root/data
    environment:
      - DEVICE_NAME=docker-container
```

---

## ⚙️ Конфигурация

### Переменные окружения

```bash
# Директория для данных
export MYSPACE_DATA_DIR="/path/to/data"

# Имя устройства
export MYSPACE_DEVICE_NAME="my-device"

# Порт WebSocket сервера
export MYSPACE_PORT=8080

# Уровень логирования
export MYSPACE_LOG_LEVEL=info
```

### Конфигурационный файл (config.json)

```json
{
  "data_dir": "./data",
  "device_name": "my-device",
  "port": 8080,
  "log_level": "info",
  "discovery": {
    "service_name": "_myspace-sync._tcp",
    "broadcast_interval": 30
  },
  "sync": {
    "max_connections": 10,
    "sync_interval": 5,
    "conflict_resolution": "last_write_wins"
  }
}
```

---

## 🧪 Тестирование

### Unit тесты для Go

```bash
cd sync-engine
go test ./...
```

### Интеграционные тесты

```bash
# Запускаем два экземпляра для теста синхронизации
./myspace-sync -data-dir ./data1 -device-name "device1" &
./myspace-sync -data-dir ./data2 -device-name "device2" &

# Проверяем логи на наличие обнаружения устройств
tail -f data1/sync.log
```

### Тестирование React компонента

```bash
npm test
npm run test:e2e
```

---

## 🚀 Развертывание в production

### Для ПК

1. Собрать Go бинарник с оптимизациями:
```bash
go build -ldflags="-s -w" -o myspace-sync ./cmd/server
```

2. Собрать React приложение:
```bash
npm run build
```

3. Настроить автозапуск (systemd/launchd)

### Для Android

1. Подписать APK:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias alias -keyalg RSA -keysize 2048 -validity 10000
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk alias
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

2. Загрузить в Google Play Store

---

## ⚠️ Подводные камни Android

### Doze режим
- Android может "усыпать" фоновые сервисы
- Решение: Foreground Service + White List

### Ограничения фоновых задач
- Android 8+ ограничивает фоновые сервисы
- Решение: JobScheduler + WorkManager

### Энергосбережение
- Производители могут ограничивать работу приложений
- Решение: инструкции для пользователей по добавлению в исключения

### Сетевые ограничения
- Некоторые сети блокируют mDNS
- Решение: fallback на ручное подключение по IP

### Разрешения
- Runtime permissions для Android 6+
- Решение: проверка разрешений при первом запуске

---

## 🔧 Отладка

### Логирование Go engine

```bash
# Уровень детализации логов
export MYSPACE_LOG_LEVEL=debug

# Запуск с логированием в файл
./myspace-sync -data-dir ./data -device-name "debug-device" 2>&1 | tee sync.log
```

### Отладка WebSocket соединения

```javascript
// В браузере
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onmessage = (e) => console.log('Received:', e.data);
```

### Проверка mDNS

```bash
# Linux/macOS
avahi-browse -r _myspace-sync._tcp

# Windows
nslookup -type=ptr _myspace-sync._tcp.local
```

---

## 📊 Мониторинг

### Метрики синхронизации
- Количество подключенных устройств
- Объем переданных данных
- Время последней синхронизации
- Количество конфликтов

### Health check endpoint

```bash
curl http://localhost:8080/health
```

Возвращает JSON со статусом системы:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "connections": 2,
  "records_count": 150,
  "last_sync": "2024-01-14T12:00:00Z"
}
```
