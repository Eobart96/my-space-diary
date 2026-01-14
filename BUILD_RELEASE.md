# 🚀 Сборка Release версий

## 📦 Windows .exe

### Шаг 1: Сборка Go Sync Engine
```bash
cd sync-engine
go build -ldflags="-s -w" -o myspace-sync-windows.exe ./cmd/server
```

### Шаг 2: Создание инсталлятора
```bash
# Создаем директорию для релиза
mkdir -p ../release/windows
cp myspace-sync-windows.exe ../release/windows/
cp -r ../../web/build ../release/windows/web/
cp ../start-windows.bat ../release/windows/
```

### Шаг 3: Запуск
```bash
# Запуск через .bat файл
cd release/windows
start-windows.bat
```

---

## 📱 Android APK

### Требования
- Android Studio
- Java JDK 11+
- Android SDK (API 24+)

### Шаг 1: Сборка Go библиотеки для Android
```bash
# Установка переменных
export ANDROID_NDK_HOME=/path/to/android-ndk
export GOOS=android
export GOARCH=arm64

# Сборка .so библиотеки
cd sync-engine
go build -buildmode=c-shared -o libmyspace-sync.so ./cmd/server

# Копирование в Android проект
mkdir -p ../android/app/src/main/jniLibs/arm64-v8a
cp libmyspace-sync.so ../android/app/src/main/jniLibs/arm64-v8a/
cp libmyspace-sync.h ../android/app/src/main/jniLibs/arm64-v8a/
```

### Шаг 2: Сборка APK
```bash
cd android
./gradlew assembleDebug
```

### Шаг 3: Сборка Release APK
```bash
# Создаем keystore (если нет)
keytool -genkey -v -keystore myspace-release.keystore -alias myspace -keyalg RSA -keysize 2048 -validity 10000

# Подписываем APK
./gradlew assembleRelease

# Копируем релизный APK
cp app/build/outputs/apk/release/app-release.apk ../release/android/MySpace-Diary.apk
```

---

## 🎯 Готовые файлы

### Windows
- `release/windows/myspace-sync-windows.exe` - Go sync engine
- `release/windows/start-windows.bat` - Скрипт запуска
- `release/windows/web/` - React приложение

### Android
- `release/android/MySpace-Diary.apk` - Готовое приложение

---

## 🚀 Быстрый запуск

### Windows
1. Распакуйте `release/windows/`
2. Запустите `start-windows.bat`
3. Откройте `http://localhost:5173`

### Android
1. Установите `MySpace-Diary.apk`
2. Разрешите все необходимые разрешения
3. Приложение автоматически запустит синхронизацию

---

## ✅ Проверка работы

### Windows
- Откройте Task Manager → должен быть `myspace-sync-windows.exe`
- Откройте браузер → `http://localhost:5173` должен работать
- Проверьте `http://localhost:8080` → должен показывать статус

### Android
- В настройках → Приложения → MySpace Diary → Должен работать Foreground Service
- В уведомлениях → Должен быть статус "Синхронизация активна"
- WebView должен загружать React приложение

---

## 🔧 Troubleshooting

### Windows
- **Firewall**: Разрешите доступ для `myspace-sync-windows.exe`
- **Antivirus**: Добавьте в исключения
- **Port 8080**: Убедитесь что порт свободен

### Android
- **Permissions**: Все разрешения должны быть предоставлены
- **Battery Optimization**: Отключите для приложения
- **Background Service**: Проверьте в настройках разработчика

---

## 📊 Размеры файлов

- **Windows exe**: ~15MB
- **Android APK**: ~25MB
- **React build**: ~5MB

---

## 🌐 Синхронизация между устройствами

1. Запустите приложение на Windows
2. Запустите приложение на Android
3. Устройства должны автоматически обнаружить друг друга
4. Создайте запись на одном устройстве → появится на другом

**Важно**: Устройства должны быть в одной WiFi сети!
