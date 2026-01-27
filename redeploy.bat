@echo off
echo 🔄 Пересборка и запуск My Space приложения...

REM Остановка и удаление существующих контейнеров
echo 🛑 Остановка контейнеров...
docker-compose down

REM Сборка и запуск контейнеров
echo 🔨 Сборка образов...
docker-compose build --no-cache

echo 🚀 Запуск контейнеров...
docker-compose up -d

REM Ожидание запуска сервисов
echo ⏳ Ожидание запуска сервисов...
timeout /t 10 /nobreak > nul

REM Проверка статуса
echo 📊 Проверка статуса контейнеров...
docker-compose ps

REM Получение IP-адреса хоста
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do set HOST_IP=%%i
set HOST_IP=%HOST_IP: =%

echo.
echo ✅ Приложение успешно развернуто!
echo.
echo 📱 Доступные URL:
echo    - Фронтенд: http://%HOST_IP%:3000
echo    - API: http://%HOST_IP%:3000/api
echo    - Health check: http://%HOST_IP%:3000/health
echo.
echo 🔍 Проверка работы:
echo    curl http://%HOST_IP%:3000/api/health
echo.
echo 📝 Логи контейнеров:
echo    docker-compose logs -f
echo.
echo 🛑 Остановка:
echo    docker-compose down
pause
