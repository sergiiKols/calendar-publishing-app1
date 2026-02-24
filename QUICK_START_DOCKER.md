# 🚀 Быстрый старт - Docker развертывание

Минимальная инструкция для развертывания Calendar App на сервере.

---

## ⚡ За 5 минут

### 1️⃣ Подготовка (на вашем сервере)

```bash
# Установить Docker (если еще не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установить Docker Compose
sudo apt-get install docker-compose-plugin

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2️⃣ Скопировать проект

```bash
# Скопировать папку calendar-app на сервер
# Или клонировать из Git
cd /path/to/calendar-app
```

### 3️⃣ Настроить переменные

```bash
# Создать .env файл
cp .env.docker.example .env

# Сгенерировать секреты
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
echo "CALENDAR_API_KEY=$(openssl rand -hex 32)" >> .env
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env

# Отредактировать .env и установить:
nano .env
# - POSTGRES_PASSWORD (сильный пароль)
# - NEXTAUTH_URL (ваш домен или IP)
```

### 4️⃣ Запустить

```bash
# Автоматическое развертывание
chmod +x deploy.sh
./deploy.sh

# ИЛИ вручную
docker-compose up -d
```

### 5️⃣ Проверить

```bash
# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f

# Открыть в браузере
http://your-server-ip:3000
```

---

## 📦 Что будет развернуто

- **PostgreSQL 15** - база данных (порт 5433)
- **Next.js App** - приложение (порт 3000)
- **Cron Service** - автопубликация (каждые 15 минут)

**Хранилище данных:** Docker volume `calendar-db-data`

---

## 🛠️ Управление

### Интерактивное меню:
```bash
chmod +x docker-helpers.sh
./docker-helpers.sh
```

### Основные команды:

```bash
# Запустить
docker-compose up -d

# Остановить
docker-compose down

# Перезапустить
docker-compose restart

# Логи
docker-compose logs -f

# Статус
docker-compose ps

# Backup БД
docker exec calendar-postgres pg_dump -U calendar_user calendar_db > backup.sql

# Очистка
docker-compose down -v
```

---

## 🌐 Настройка домена (опционально)

### С Nginx:

```bash
# Установить Nginx
sudo apt-get install nginx

# Создать конфиг
sudo nano /etc/nginx/sites-available/calendar
```

**Конфигурация:**
```nginx
server {
    listen 80;
    server_name calendar.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Активировать
sudo ln -s /etc/nginx/sites-available/calendar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d calendar.yourdomain.com
```

---

## 🔧 Первоначальная настройка

После развертывания:

1. Откройте `http://your-server-ip:3000`
2. Создайте администратора
3. Войдите в систему
4. Настройте платформы публикации (WordPress, Telegram, и т.д.)
5. Проверьте интеграцию с SMI проектом

---

## 📊 Системные требования

**Минимальные:**
- RAM: 2 GB
- CPU: 2 ядра
- Диск: 5 GB
- OS: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)

**Рекомендуемые:**
- RAM: 4 GB
- CPU: 4 ядра
- Диск: 10 GB
- SSD диск

---

## ❓ Помощь

### Логи ошибок:
```bash
docker-compose logs calendar-app
docker-compose logs calendar-db
```

### Перезапуск при ошибке:
```bash
docker-compose restart calendar-app
```

### Полная переустановка:
```bash
docker-compose down -v
./deploy.sh
```

### Интерактивная консоль БД:
```bash
docker exec -it calendar-postgres psql -U calendar_user -d calendar_db
```

---

## 📞 Полная документация

См. `DOCKER_DEPLOYMENT.md` для детальных инструкций.

---

**Готово! Приложение работает! 🎉**
