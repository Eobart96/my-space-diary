# Persistent Database Setup Guide

## Проблема
После перезагрузки сервера данные в PostgreSQL не сохранялись, потому что Docker контейнер использовал эфемерное хранилище.

## Решение
Настроил постоянное хранилище (Docker volume) для PostgreSQL.

## Что было сделано:

### 1. Улучшен docker-compose.yml
- Добавлен volume `postgres_data` с драйвером `local`
- Добавлен init скрипт для автоматического создания таблиц
- Настроен `restart: unless-stopped` для всех сервисов

### 2. Созданы файлы:
- `.env.production` - переменные окружения для production
- `database/init/01-init-schema.init` - скрипт инициализации БД
- `deploy-persistent.sh` - скрипт развертывания с сохранением данных

## Развертывание на сервере:

### 1. Скопируйте файлы на сервер:
```bash
scp -r ./* user@your-server:/path/to/myspace/
```

### 2. Запустите развертывание:
```bash
cd /path/to/myspace
chmod +x deploy-persistent.sh
./deploy-persistent.sh
```

### 3. Проверьте статус:
```bash
docker-compose ps
docker-compose logs
```

## Управление данными:

### Проверка volume:
```bash
docker volume ls | grep myspace
docker volume inspect myspace_postgres_data
```

### Бэкап базы данных:
```bash
mkdir -p backups
docker run --rm -v myspace_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

### Восстановление базы данных:
```bash
docker run --rm -v myspace_postgres_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/postgres_backup_YYYYMMDD_HHMMSS.tar.gz -C /data
docker-compose restart postgres
```

## Проверка работоспособности:
1. Зайдите на http://your-server-ip:3000
2. Создайте тестовую запись в дневнике или питании
3. Перезагрузите сервер: `sudo reboot`
4. После перезагрузки проверьте, что записи сохранились

## Важные моменты:
- Данные теперь хранятся в Docker volume `myspace_postgres_data`
- Volume сохраняется между перезагрузками контейнера и сервера
- Автоматически создаются таблицы при первом запуске
- Все сервисы автоматически перезапускаются после сбоя
