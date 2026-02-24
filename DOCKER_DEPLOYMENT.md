# 🐳 Docker Deployment Guide - Calendar Publishing App

Полное руководство по развертыванию приложения на сервере с использованием Docker.

---

## 📋 Предварительные требования

### На вашем сервере должны быть установлены:

1. **Docker** (версия 20.10+)
   ```bash
   docker --version
   ```

2. **Docker Compose** (версия 2.0+)
   ```bash
   docker-compose --version
   # или
   docker compose version
   ```

### Если Docker не установлен:

**Ubuntu/Debian:**
```bash
# Обновить пакеты
sudo apt-get update

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установить Docker Compose
sudo apt-get install docker-compose-plugin

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

**CentOS/RHEL:**
```bash
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

---

## 🚀 Быстрое развертывание

### Шаг 1: Скопировать проект на сервер

```bash
# На вашем локальном компьютере
scp -r calendar-app user@your-server:/path/to/deployment/

# ИЛИ клонировать из Git
ssh user@your-server
git clone <your-repo-url> calendar-app
cd calendar-app
```

### Шаг 2: Настроить переменные окружения

```bash
cd calendar-app

# Создать .env файл из шаблона
cp .env.docker.example .env

# Отредактировать .env
nano .env
# или
vi .env
```

**Обязательно изменить:**
```env
# 1. Пароль базы данных
POSTGRES_PASSWORD=your_strong_password_here

# 2. NextAuth секрет (сгенерировать)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 3. API ключи
CALENDAR_API_KEY=random_api_key_$(openssl rand -hex 16)
CRON_SECRET=random_cron_secret_$(openssl rand -hex 16)

# 4. URL приложения
NEXTAUTH_URL=http://your-server-ip:3000
# или с доменом
NEXTAUTH_URL=https://calendar.yourdomain.com
```

### Шаг 3: Запустить развертывание

**Автоматический способ (рекомендуется):**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Ручной способ:**
```bash
# Собрать образы
docker-compose build

# Запустить контейнеры
docker-compose up -d

# Проверить статус
docker-compose ps
```

### Шаг 4: Проверить развертывание

```bash
# Просмотр логов
docker-compose logs -f

# Проверить, что контейнеры запущены
docker-compose ps

# Должны быть запущены:
# - calendar-postgres
# - calendar-nextjs
# - calendar-cron
```

---

## 🌐 Доступ к приложению

### Локальный доступ:
```
http://localhost:3000
```

### Удаленный доступ:
```
http://your-server-ip:3000
```

### С доменным именем:
Настройте Nginx reverse proxy (см. раздел ниже).

---

## 🔧 Управление контейнерами

### Основные команды:

```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Логи только приложения
docker-compose logs -f calendar-app

# Логи только базы данных
docker-compose logs -f calendar-db

# Остановить все контейнеры
docker-compose down

# Остановить и удалить данные
docker-compose down -v

# Перезапустить приложение
docker-compose restart calendar-app

# Перезапустить всё
docker-compose restart

# Пересобрать и перезапустить
docker-compose up -d --build

# Проверить использование ресурсов
docker stats
```

### Вход в контейнер:

```bash
# Вход в контейнер приложения
docker exec -it calendar-nextjs sh

# Вход в контейнер БД
docker exec -it calendar-postgres psql -U calendar_user -d calendar_db
```

---

## 🔐 Настройка Nginx Reverse Proxy (опционально)

Если хотите использовать доменное имя и HTTPS:

### Установить Nginx:
```bash
sudo apt-get install nginx certbot python3-certbot-nginx
```

### Создать конфигурацию:
```bash
sudo nano /etc/nginx/sites-available/calendar
```

**Содержимое файла:**
```nginx
server {
    listen 80;
    server_name calendar.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Активировать конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/calendar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Получить SSL сертификат:
```bash
sudo certbot --nginx -d calendar.yourdomain.com
```

---

## 💾 Backup и Restore

### Backup базы данных:

```bash
# Создать backup
docker exec calendar-postgres pg_dump -U calendar_user calendar_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Или с сжатием
docker exec calendar-postgres pg_dump -U calendar_user calendar_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore базы данных:

```bash
# Из обычного backup
docker exec -i calendar-postgres psql -U calendar_user calendar_db < backup_20260224_120000.sql

# Из сжатого backup
gunzip < backup_20260224_120000.sql.gz | docker exec -i calendar-postgres psql -U calendar_user calendar_db
```

### Автоматический backup (cron):

```bash
# Добавить в crontab
crontab -e

# Backup каждый день в 2:00 ночи
0 2 * * * docker exec calendar-postgres pg_dump -U calendar_user calendar_db | gzip > /backups/calendar_backup_$(date +\%Y\%m\%d).sql.gz
```

---

## 🐛 Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверить логи
docker-compose logs calendar-app

# Проверить, запущена ли БД
docker-compose logs calendar-db
```

### Проблема: Ошибка подключения к БД

```bash
# Проверить, что БД готова
docker exec calendar-postgres pg_isready -U calendar_user

# Проверить переменные окружения
docker exec calendar-nextjs env | grep POSTGRES
```

### Проблема: Порт уже занят

```bash
# Проверить, что использует порт 3000
sudo lsof -i :3000

# Изменить порт в docker-compose.yml
# Заменить "3000:3000" на "8080:3000"
```

### Проблема: Нехватка места

```bash
# Очистить неиспользуемые образы
docker system prune -a

# Проверить использование места
docker system df
```

---

## 📊 Мониторинг

### Проверка статуса:

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов в реальном времени
docker stats

# Проверка здоровья БД
docker exec calendar-postgres pg_isready -U calendar_user
```

### Просмотр логов приложения:

```bash
# Последние 100 строк
docker-compose logs --tail=100 calendar-app

# Следить за логами в реальном времени
docker-compose logs -f calendar-app

# Логи за последний час
docker-compose logs --since 1h calendar-app
```

---

## 🔄 Обновление приложения

### Когда вышла новая версия:

```bash
# Скачать новый код
git pull

# Пересобрать и перезапустить
docker-compose up -d --build

# Проверить логи
docker-compose logs -f calendar-app
```

---

## 📞 Полезные ссылки

- **Документация Docker**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **PostgreSQL Docker**: https://hub.docker.com/_/postgres
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## 🎯 Чеклист после развертывания

- [ ] Все контейнеры запущены (`docker-compose ps`)
- [ ] Приложение доступно по URL
- [ ] База данных инициализирована
- [ ] Создан админ пользователь
- [ ] Настроены платформы публикации
- [ ] Настроен автоматический backup
- [ ] Настроен Nginx (если используется)
- [ ] Получен SSL сертификат (если используется)
- [ ] Проверена автопубликация (cron)

---

**Готово! Ваше приложение развернуто и работает! 🎉**
