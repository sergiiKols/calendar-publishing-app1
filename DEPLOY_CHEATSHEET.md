# 🚀 Шпаргалка по развертыванию - Calendar App

## ⚡ Самый быстрый способ (5 минут)

### На вашем сервере выполните:

```bash
# 1. Перейти в папку проекта
cd calendar-app

# 2. Создать .env файл
cp .env.docker.example .env

# 3. Отредактировать .env - ОБЯЗАТЕЛЬНО изменить пароли!
nano .env
# или
vim .env

# 4. Запустить
docker-compose up -d

# 5. Проверить статус
docker-compose ps
```

**Готово!** → `http://ваш-сервер:3000`

---

## 🔑 Что обязательно изменить в .env

```bash
# Откройте .env и измените:
POSTGRES_PASSWORD=ваш_сложный_пароль_123
NEXTAUTH_SECRET=сгенерируйте_случайную_строку_min_32_символа
CALENDAR_API_KEY=ваш_api_ключ_для_защиты
CRON_SECRET=секрет_для_cron_jobs

# Остальное можно оставить как есть для начала
```

### Как сгенерировать NEXTAUTH_SECRET:
```bash
# На сервере:
openssl rand -base64 32

# Или онлайн:
# Зайти на https://generate-secret.vercel.app/32
```

---

## 📋 Команды управления

```bash
# Запустить
docker-compose up -d

# Остановить
docker-compose down

# Перезапустить
docker-compose restart

# Логи в реальном времени
docker-compose logs -f

# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats
```

---

## 🔧 Первая настройка после запуска

### 1. Создать администратора
Откройте в браузере:
```
http://ваш-сервер:3000/api/reset-admin
```

Вы увидите:
```json
{
  "success": true,
  "message": "Admin created",
  "credentials": {
    "username": "admin",
    "password": "admin123"
  }
}
```

### 2. Войти в систему
```
http://ваш-сервер:3000/login
```
- Username: `admin`
- Password: `admin123`

### 3. Сменить пароль админа
После входа **обязательно** смените пароль!

---

## 🌐 Если нужен домен и HTTPS

### С Nginx (на том же сервере):

```bash
# 1. Установить Nginx
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# 2. Скопировать конфигурацию
sudo cp nginx.conf.example /etc/nginx/sites-available/calendar

# 3. Отредактировать
sudo nano /etc/nginx/sites-available/calendar
# Изменить: your-domain.com на ваш реальный домен

# 4. Активировать
sudo ln -s /etc/nginx/sites-available/calendar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 5. Получить SSL сертификат
sudo certbot --nginx -d your-domain.com
```

---

## ⚠️ Troubleshooting

### Порт 3000 занят?
```bash
# В docker-compose.yml измените:
ports:
  - "8080:3000"  # Вместо 3000:3000

# Тогда открывайте: http://ваш-сервер:8080
```

### Контейнеры не запускаются?
```bash
# Проверить логи
docker-compose logs

# Пересоздать
docker-compose down -v
docker-compose up -d
```

### База данных пустая?
```bash
# Проверить инициализацию
docker-compose logs postgres

# Вручную создать схему
docker-compose exec postgres psql -U calendar_user calendar_db < lib/db/schema.sql
```

### Недостаточно памяти?
```bash
# Проверить
free -h

# Добавить swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 🔄 Обновление приложения

```bash
# 1. Остановить
docker-compose down

# 2. Получить новый код (через git)
git pull

# 3. Пересобрать образы
docker-compose build --no-cache

# 4. Запустить
docker-compose up -d
```

---

## 💾 Backup базы данных

### Создать backup:
```bash
docker-compose exec postgres pg_dump -U calendar_user calendar_db > backup_$(date +%Y%m%d).sql
```

### Восстановить backup:
```bash
cat backup_20260224.sql | docker-compose exec -T postgres psql -U calendar_user calendar_db
```

### Автоматический backup (cron):
```bash
# Добавить в crontab
crontab -e

# Каждый день в 3:00 утра
0 3 * * * cd /path/to/calendar-app && docker-compose exec postgres pg_dump -U calendar_user calendar_db > /backups/calendar_$(date +\%Y\%m\%d).sql
```

---

## 📊 Мониторинг

### Проверить здоровье:
```bash
# CPU и память
docker stats

# Логи приложения
docker-compose logs -f app

# Логи базы данных
docker-compose logs -f postgres

# Размер базы данных
docker-compose exec postgres psql -U calendar_user calendar_db -c "SELECT pg_size_pretty(pg_database_size('calendar_db'));"
```

---

## 🔒 Безопасность

### ✅ Чеклист безопасности:
- [ ] Изменены все пароли в .env
- [ ] NEXTAUTH_SECRET - случайная строка (32+ символа)
- [ ] Сменен пароль админа после первого входа
- [ ] Настроен firewall (открыть только 80, 443, 22)
- [ ] Настроен HTTPS через Nginx + Let's Encrypt
- [ ] Регулярные backups базы данных

### Firewall (UFW):
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📞 Нужна помощь?

Смотрите подробные инструкции:
- `QUICK_START_DOCKER.md` - быстрый старт
- `DOCKER_DEPLOYMENT.md` - полная документация
- `DOCKER_README.md` - обзор

---

**Успешного развертывания! 🎉**
