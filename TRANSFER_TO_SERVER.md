# 📤 Перенос Calendar App на сервер

## Способы переноса проекта

### 🎯 Способ 1: Git (Рекомендуется)

**Если проект в Git репозитории:**

```bash
# На сервере
cd /home/your-user/
git clone https://github.com/your-username/calendar-app.git
cd calendar-app

# Настроить .env
cp .env.docker.example .env
nano .env  # Изменить пароли и секреты

# Запустить
docker-compose up -d
```

---

### 🎯 Способ 2: SCP (прямая передача)

**Если Git недоступен:**

```bash
# На вашем компьютере (из папки проекта)
cd /path/to/workspace

# Передать весь проект на сервер
scp -r calendar-app user@your-server-ip:/home/user/

# Затем зайти на сервер
ssh user@your-server-ip
cd /home/user/calendar-app

# Настроить .env
cp .env.docker.example .env
nano .env

# Запустить
docker-compose up -d
```

---

### 🎯 Способ 3: Архив (для медленного интернета)

```bash
# На вашем компьютере - создать архив
cd /path/to/workspace
tar -czf calendar-app.tar.gz calendar-app/

# Передать архив
scp calendar-app.tar.gz user@your-server-ip:/home/user/

# На сервере - распаковать
ssh user@your-server-ip
cd /home/user/
tar -xzf calendar-app.tar.gz
cd calendar-app

# Настроить и запустить
cp .env.docker.example .env
nano .env
docker-compose up -d
```

---

### 🎯 Способ 4: SFTP (графический интерфейс)

**Используя FileZilla, WinSCP или Cyberduck:**

1. Подключиться к серверу по SFTP
2. Перетащить папку `calendar-app` в `/home/user/`
3. Через SSH выполнить:
   ```bash
   cd /home/user/calendar-app
   cp .env.docker.example .env
   nano .env
   docker-compose up -d
   ```

---

## 📋 Что нужно перенести

### ✅ Обязательные файлы/папки:

```
calendar-app/
├── Dockerfile                    ← Docker образ
├── docker-compose.yml            ← Оркестрация
├── .env.docker.example           ← Шаблон переменных
├── .dockerignore                 ← Исключения
├── package.json                  ← Зависимости
├── package-lock.json             ← Версии пакетов
├── next.config.js                ← Конфигурация Next.js
├── tsconfig.json                 ← TypeScript конфиг
├── tailwind.config.js            ← TailwindCSS
├── postcss.config.js             ← PostCSS
├── app/                          ← Приложение Next.js
├── components/                   ← React компоненты
├── lib/                          ← Библиотеки и утилиты
│   └── db/                       ← Скрипты базы данных
│       ├── schema.sql            ← ⚠️ ВАЖНО! Схема БД
│       └── ...
└── public/                       ← Статические файлы
```

### ❌ НЕ переносить:

- `node_modules/` (будет установлено в Docker)
- `.next/` (будет создано при сборке)
- `.env` или `.env.local` (создать новый на сервере)
- `.git/` (опционально, если используете архив)

---

## 🔧 Подготовка сервера

### 1. Установить Docker (если ещё не установлен)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
# Выйти и войти снова для применения
```

### 2. Проверить Docker

```bash
docker --version
docker-compose --version
```

Должно показать версии (например: Docker 24.x, docker-compose 2.x)

---

## 🚀 После переноса на сервер

### 1. Создать и настроить .env

```bash
cd calendar-app
cp .env.docker.example .env
nano .env
```

**⚠️ ОБЯЗАТЕЛЬНО изменить:**

```bash
POSTGRES_PASSWORD=ваш_сложный_пароль_здесь
NEXTAUTH_SECRET=результат_openssl_rand_base64_32
CALENDAR_API_KEY=ваш_api_ключ
CRON_SECRET=секрет_для_cron
```

Сгенерировать NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 2. Изменить URL (если есть домен)

```bash
# В .env изменить:
NEXTAUTH_URL=https://your-domain.com
```

### 3. Запустить

```bash
docker-compose up -d
```

### 4. Проверить запуск

```bash
# Статус контейнеров
docker-compose ps

# Должно быть:
# calendar-postgres  running  5432/tcp, 0.0.0.0:5433->5432/tcp
# calendar-nextjs    running  0.0.0.0:3000->3000/tcp
# calendar-cron      running

# Логи
docker-compose logs -f
```

### 5. Создать администратора

Откройте в браузере:
```
http://your-server-ip:3000/api/reset-admin
```

Или через curl на сервере:
```bash
curl http://localhost:3000/api/reset-admin
```

Вы получите:
```json
{
  "success": true,
  "credentials": {
    "username": "admin",
    "password": "admin123"
  }
}
```

### 6. Войти в систему

```
http://your-server-ip:3000/login
```

---

## 🔒 Настройка Firewall

```bash
# Открыть необходимые порты
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 3000/tcp # Calendar App
sudo ufw enable

# Если будете использовать Nginx:
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

---

## 🌐 Настройка домена (опционально)

### Если у вас есть домен:

1. Направить A-запись домена на IP сервера
2. Установить Nginx:
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```
3. Скопировать конфигурацию:
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/calendar
   sudo nano /etc/nginx/sites-available/calendar
   # Изменить: your-domain.com -> ваш реальный домен
   ```
4. Активировать:
   ```bash
   sudo ln -s /etc/nginx/sites-available/calendar /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
5. Получить SSL:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## ✅ Checklist переноса

- [ ] Docker и docker-compose установлены на сервере
- [ ] Проект перенесен на сервер (git/scp/архив)
- [ ] Создан файл .env из .env.docker.example
- [ ] Изменены все пароли и секреты в .env
- [ ] Запущен docker-compose up -d
- [ ] Все 3 контейнера работают (docker-compose ps)
- [ ] Создан администратор (/api/reset-admin)
- [ ] Успешный вход в систему
- [ ] Настроен firewall
- [ ] (Опционально) Настроен домен и SSL

---

## 🆘 Возможные проблемы

### "Cannot connect to Docker daemon"
```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
# Выйти и войти снова
```

### "Port 3000 already in use"
```bash
# Найти процесс
sudo lsof -i :3000
# Или изменить порт в docker-compose.yml
ports:
  - "8080:3000"
```

### "Database connection failed"
```bash
# Проверить логи PostgreSQL
docker-compose logs postgres

# Пересоздать БД
docker-compose down -v
docker-compose up -d
```

---

## 📞 Полезные команды

```bash
# Остановить
docker-compose down

# Перезапустить
docker-compose restart

# Обновить код (через git)
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Backup БД
docker-compose exec postgres pg_dump -U calendar_user calendar_db > backup.sql

# Посмотреть логи
docker-compose logs -f app
docker-compose logs -f postgres
```

---

**Успешного переноса! 🚀**

После развертывания смотрите: `DEPLOY_CHEATSHEET.md` для управления системой.
