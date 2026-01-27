# Полное руководство по развертыванию My Space App

## Содержание
1. [Подготовка сервера](#подготовка-сервера)
2. [Автоматическое развертывание](#автоматическое-развертывание)
3. [Ручное развертывание](#ручное-развертывание)
4. [Настройка домена и SSL](#настройка-домена-и-ssl)
5. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)
6. [Резервное копирование](#резервное-копирование)
7. [Обновление приложения](#обновление-приложения)

## Подготовка сервера

### Требования к серверу
- **CPU**: Минимум 2 ядра (рекомендуется 4)
- **RAM**: Минимум 4 ГБ (рекомендуется 8 ГБ)
- **Storage**: Минимум 20 ГБ SSD
- **OS**: Ubuntu 20.04+ или CentOS 8+
- **Сеть**: Открытые порты 22, 80, 443

### Начальная настройка Ubuntu

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Создание пользователя для приложения
sudo adduser myspace
sudo usermod -aG sudo myspace

# Переключение на нового пользователя
su - myspace
```

### Установка необходимых пакетов

```bash
# Базовые утилиты
sudo apt install -y curl wget git unzip htop vim

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker myspace

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Настройка файрвола
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## Автоматическое развертывание

### Использование скрипта развертывания

```bash
# Клонирование репозитория
git clone <URL-вашего-репозитория> myspace
cd myspace

# Запуск автоматического развертывания
chmod +x deploy.sh
./deploy.sh
```

**Что делает скрипт:**
1. Устанавливает все зависимости
2. Настраивает окружение
3. Создает Docker контейнеры
4. Запускает приложения
5. Выполняет миграции базы данных
6. Настраивает Nginx

## Ручное развертывание

### Шаг 1: Клонирование и настройка

```bash
# Клонирование репозитория
git clone <URL-вашего-репозитория> myspace
cd myspace

# Создание конфигурационного файла
cp .env.example .env
nano .env
```

### Шаг 2: Настройка переменных окружения

Отредактируйте файл `.env`:

```env
# Пароль для базы данных (сгенерируйте новый)
POSTGRES_PASSWORD=ваш_надежный_пароль

# JWT секрет (сгенерируйте новый)
JWT_SECRET=ваш_jwt_секрет_ключ

# Доменное имя
DOMAIN_NAME=ваш-домен.com

# Email для SSL
SSL_EMAIL=admin@ваш-домен.com

# Окружение
NODE_ENV=production
```

**Генерация секретов:**
```bash
# Генерация пароля для PostgreSQL
openssl rand -base64 32

# Генерация JWT секрета
openssl rand -base64 64
```

### Шаг 3: Создание директорий

```bash
# Создание необходимых директорий
mkdir -p nginx/sites-available nginx/sites-enabled nginx/ssl nginx/logs backups
```

### Шаг 4: Развертывание приложения

```bash
# Сборка и запуск контейнеров (production)
docker-compose -f docker-compose.prod.yml up -d --build

# Ожидание запуска сервисов
sleep 30

# Выполнение миграций базы данных
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Проверка статуса сервисов
docker-compose -f docker-compose.prod.yml ps
```

### Шаг 5: Проверка работоспособности

```bash
# Проверка здоровья приложения
curl http://localhost/health

# Проверка API
curl http://localhost/api/health

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs
```

## Настройка домена и SSL

### Вариант 1: Let's Encrypt (рекомендуется)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение SSL сертификата
sudo certbot --nginx -d ваш-домен.com

# Настройка автопродления
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Вариант 2: Самоподписанный сертификат

```bash
# Создание SSL сертификата
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/nginx.key \
  -out nginx/ssl/nginx.crt \
  -subj "/C=RU/ST=State/L=City/O=Organization/CN=ваш-домен.com"

# Настройка прав доступа
sudo chmod 600 nginx/ssl/nginx.key
sudo chmod 644 nginx/ssl/nginx.crt
```

### Настройка Nginx для домена

Обновите файл `nginx/sites-available/myspace`:

Если вы используете `docker-compose.prod.yml`, основной конфиг Nginx находится в `nginx/default.conf` и монтируется в контейнер `nginx` как `/etc/nginx/conf.d/default.conf`.

```nginx
server {
    listen 80;
    server_name ваш-домен.com www.ваш-домен.com;
    
    # Перенаправление на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ваш-домен.com www.ваш-домен.com;

    # SSL конфигурация
    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## Мониторинг и обслуживание

### Просмотр логов

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs postgres

# Логи в реальном времени
docker-compose -f docker-compose.prod.yml logs -f
```

### Мониторинг ресурсов

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Использование ресурсов
docker stats

# Информация о диске
df -h

# Информация о памяти
free -h
```

### Перезапуск сервисов

```bash
# Перезапуск всех сервисов
docker-compose -f docker-compose.prod.yml restart

# Перезапуск конкретного сервиса
docker-compose -f docker-compose.prod.yml restart backend

# Полная перезагрузка
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Резервное копирование

### Автоматическое резервирование

Создайте скрипт `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/myspace/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Резервное копирование базы данных
echo "Создание резервной копии базы данных..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U myspace myspace > $BACKUP_DIR/database_$DATE.sql

# Сжатие бэкапа
echo "Сжатие резервной копии..."
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR database_$DATE.sql

# Удаление несжатого файла
rm $BACKUP_DIR/database_$DATE.sql

# Удаление старых бэкапов (оставляем последние 7)
echo "Очистка старых бэкапов..."
find $BACKUP_DIR -name "backup_*.tar.gz" -type f -mtime +7 -delete

echo "Резервное копирование завершено: backup_$DATE.tar.gz"
```

Настройка автоматического бэкапа:

```bash
# Сделать скрипт исполняемым
chmod +x backup.sh

# Добавить в crontab
crontab -e
# Добавить строку для ежедневного бэкапа в 3:00:
0 3 * * * /opt/myspace/backup.sh
```

### Восстановление из бэкапа

```bash
# Остановка приложения
docker-compose -f docker-compose.prod.yml down

# Восстановление базы данных
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10

# Восстановление из бэкапа
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U myspace myspace < backup_20260126.sql

# Запуск приложения
docker-compose -f docker-compose.prod.yml up -d
```

## Обновление приложения

### Автоматическое обновление

Используйте скрипт `update.sh`:

```bash
#!/bin/bash

echo "Обновление My Space App..."

# Переход в директорию приложения
cd /opt/myspace

# Получение последних изменений
echo "Получение последних изменений..."
git pull origin main

# Пересборка и перезапуск
echo "Пересборка и перезапуск сервисов..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Выполнение миграций
echo "Выполнение миграций базы данных..."
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

echo "Обновление завершено!"
```

### Ручное обновление

```bash
# Получение последних изменений
git pull origin main

# Пересборка контейнеров
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Выполнение миграций
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Проверка работоспособности
docker-compose -f docker-compose.prod.yml ps
curl http://localhost/health
```

## Решение проблем

### Частые проблемы

1. **Контейнеры не запускаются**
   ```bash
   # Проверка логов
   docker-compose -f docker-compose.prod.yml logs
   
   # Проверка конфигурации
   docker-compose -f docker-compose.prod.yml config
   ```

2. **Проблемы с базой данных**
   ```bash
   # Проверка подключения к БД
   docker-compose -f docker-compose.prod.yml exec postgres psql -U myspace -d myspace
   
   # Проверка статуса PostgreSQL
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U myspace
   ```

3. **Проблемы с портами**
   ```bash
   # Проверка занятых портов
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   
   # Остановка конфликтующих сервисов
   sudo systemctl stop nginx
   ```

4. **Недостаточно памяти**
   ```bash
   # Проверка использования памяти
   free -h
   docker stats
   
   # Очистка Docker
   docker system prune -f
   ```

### Полная переустановка

```bash
# Остановка и удаление контейнеров
docker-compose -f docker-compose.prod.yml down -v

# Удаление образов
docker system prune -a -f

# Повторное развертывание
./deploy.sh
```

## Безопасность

### Рекомендации по безопасности

1. **Регулярно обновляйте систему**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Используйте сложные пароли**
   - Генерируйте уникальные пароли для каждого окружения
   - Используйте менеджеры паролей

3. **Настройте SSL**
   - Всегда используйте HTTPS в production
   - Обновляйте SSL сертификаты

4. **Резервное копирование**
   - Настройте регулярные бэкапы
   - Проверяйте восстановление из бэкапов

5. **Мониторинг**
   - Следите за логами ошибок
   - Мониторьте использование ресурсов

6. **Файрвол**
   - Держите UFW включенным
   - Открывайте только необходимые порты

## Производительность

### Оптимизация

1. **База данных**
   - Используйте индексы для частых запросов
   - Настройте connection pooling
   - Рассмотрите managed PostgreSQL для больших нагрузок

2. **Frontend**
   - Включите кэширование статических файлов
   - Используйте CDN для статических ресурсов
   - Оптимизируйте изображения

3. **Backend**
   - Настройте rate limiting
   - Используйте Redis для кэширования
   - Оптимизируйте запросы к БД

### Масштабирование

```bash
# Масштабирование бэкенда
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Масштабирование фронтенда
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

## Контакты и поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs`
2. Посмотрите документацию: `DEPLOYMENT_UBUNTU.md`
3. Создайте issue на GitHub
4. Свяжитесь с командой разработки

---

**Важно:** Регулярно проверяйте работоспособность приложения и выполняйте резервное копирование данных.
