# 🚀 Деплой Calendar App на Dokploy

## Шаг 1: Создание PostgreSQL базы данных

### 1.1 В Dokploy перейдите в раздел "Databases" или "Services"

### 1.2 Создайте новую PostgreSQL базу данных со следующими параметрами:

```
Имя сервиса: calendar-db
Тип: PostgreSQL
Версия: 15 или 16 (последняя стабильная)

Настройки:
- Database Name: calendar_db
- Username: calendar_user
- Password: CalendarPass2026Secure!
```

### 1.3 После создания запишите:
- **Internal URL** (обычно вида: `postgresql://calendar_user:password@calendar-db:5432/calendar_db`)
- **External URL** (если нужен внешний доступ)

---

## Шаг 2: Инициализация схемы базы данных

### 2.1 Получите доступ к базе данных через Dokploy

В разделе базы данных найдите кнопку "Connect" или "Terminal" и выполните:

```sql
-- Скопируйте и выполните этот SQL скрипт
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  credentials JSONB,
  platforms JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  smi_project_id VARCHAR(255),
  smi_sync_enabled BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  scheduled_date TIMESTAMP NOT NULL,
  platforms JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  published_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  arrival_token VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS published_articles (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_post_id VARCHAR(255),
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  response_data JSONB
);

CREATE INDEX idx_events_scheduled_date ON events(scheduled_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_events_project_id ON events(project_id);
```

### 2.2 Альтернатива: Автоматическая инициализация

Если в Dokploy есть возможность запустить init-скрипт, используйте файл из репозитория:
`lib/db/schema.sql`

---

## Шаг 3: Создание приложения Calendar App

### 3.1 В Dokploy создайте новое приложение:

```
Тип: Docker Compose
Или: Git Repository

Название: calendar-publishing-app1
Repository: https://github.com/sergiiKols/calendar-publishing-app1.git
Branch: main
```

### 3.2 Настройте переменные окружения:

**ОБЯЗАТЕЛЬНЫЕ переменные:**

```env
# Database (используйте Internal URL от вашей БД)
DATABASE_URL=postgresql://calendar_user:CalendarPass2026Secure!@calendar-db:5432/calendar_db

# NextAuth
NEXTAUTH_URL=https://your-app-url.dokploy.energo-audit.online
NEXTAUTH_SECRET=abc123VeryLongSecretKey32charsHere!!

# Encryption
ENCRYPTION_KEY=def456AnotherSecretKey32chars!!

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass123!

# API Tokens
SMI_API_TOKEN=ваш_smi_токен
CALENDAR_API_KEY=ваш_smi_токен
CRON_SECRET=cron_secret_2026

# System
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**⚠️ Важно:** 
- Замените `NEXTAUTH_URL` на реальный URL вашего приложения
- Замените `SMI_API_TOKEN` на реальный токен
- Если Dokploy создал БД автоматически, используйте их `DATABASE_URL`

---

## Шаг 4: Деплой приложения

### 4.1 Если используете Docker Compose:

Убедитесь, что в `docker-compose.yml` есть зависимость от БД:

```yaml
services:
  app:
    depends_on:
      - db
    environment:
      - DATABASE_URL=${DATABASE_URL}
      # ... остальные переменные
```

### 4.2 Запустите деплой

Нажмите "Deploy" в Dokploy

### 4.3 Проверьте логи

Перейдите в раздел "Logs" и убедитесь, что:
- ✅ Приложение успешно подключилось к БД
- ✅ Создан администратор
- ✅ Приложение запустилось на порту 3000

---

## Шаг 5: Настройка Cron для автопубликации

### 5.1 В Dokploy создайте новый сервис Cron:

```
Тип: Cron Job
Расписание: */5 * * * * (каждые 5 минут)
Команда: curl -X POST https://your-app-url/api/cron/publish?secret=cron_secret_2026
```

**Или** используйте встроенный cron в docker-compose.yml:

```yaml
cron:
  image: curlimages/curl:latest
  depends_on:
    - app
  command: >
    sh -c "while true; do 
      curl -X POST http://app:3000/api/cron/publish?secret=$${CRON_SECRET}; 
      sleep 300; 
    done"
  environment:
    - CRON_SECRET=${CRON_SECRET}
```

---

## Шаг 6: Первый вход в систему

1. Откройте ваше приложение: `https://your-app-url.dokploy.energo-audit.online`
2. Войдите с учетными данными:
   - Email: `admin@example.com`
   - Password: `AdminPass123!`
3. Создайте первый проект
4. Добавьте учетные данные для платформ (WordPress, Telegram и т.д.)

---

## 🔍 Проверка работоспособности

### Проверить БД:
```bash
# В терминале БД выполните:
SELECT * FROM users;
# Должен быть администратор
```

### Проверить приложение:
```bash
# Откройте в браузере:
https://your-app-url/api/auth/signin
# Должна открыться страница входа
```

### Проверить автопубликацию:
```bash
# Вручную вызовите endpoint:
curl -X POST https://your-app-url/api/cron/publish?secret=cron_secret_2026
# Должен вернуть JSON с результатами
```

---

## ❓ Частые проблемы

### Ошибка подключения к БД:
- Проверьте, что `DATABASE_URL` правильный
- Убедитесь, что БД запущена
- Проверьте внутреннюю сеть Dokploy (обычно используется имя сервиса: `calendar-db`)

### Ошибка "Invalid NEXTAUTH_URL":
- Убедитесь, что `NEXTAUTH_URL` содержит полный URL с протоколом (https://)
- URL должен совпадать с реальным доменом приложения

### Админ не создается:
- Проверьте логи приложения
- Убедитесь, что переменные `ADMIN_EMAIL` и `ADMIN_PASSWORD` установлены
- Проверьте, что БД инициализирована (таблица `users` создана)

---

## 📞 Следующие шаги

1. ✅ Настроить домен (если нужно)
2. ✅ Настроить SSL сертификат (Let's Encrypt)
3. ✅ Добавить учетные данные платформ в UI
4. ✅ Протестировать публикацию
5. ✅ Настроить мониторинг и бэкапы

---

## 🎯 Краткая шпаргалка для Dokploy

```
1. Создать PostgreSQL базу → Записать DATABASE_URL
2. Выполнить SQL скрипт инициализации (schema.sql)
3. Создать приложение из GitHub репозитория
4. Добавить переменные окружения
5. Задеплоить приложение
6. Настроить Cron для автопубликации
7. Войти как админ и настроить проекты
```

Готово! 🚀
