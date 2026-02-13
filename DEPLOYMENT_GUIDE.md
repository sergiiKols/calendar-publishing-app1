# 🚀 Calendar App - Deployment Guide

## 📦 Что это за проект?

**Calendar App** - автономное приложение для планирования и автоматической публикации контента из SMI проекта.

## 📂 Структура проекта

```
calendar-app/
├── app/                        # Next.js App Router
│   ├── (auth)/login/          # Страница логина
│   ├── (dashboard)/calendar/  # Главная страница календаря
│   └── api/                   # API endpoints
│       ├── articles/          # Приём и управление статьями
│       ├── calendar/          # События календаря
│       ├── cron/             # Автопубликация (Vercel Cron)
│       └── auth/             # NextAuth
├── components/                # React компоненты
├── lib/                       # Утилиты
│   ├── db/                   # Database client
│   └── publishers/           # Publishers для платформ
├── package.json              # Зависимости
├── .env.example             # Пример переменных окружения
└── README.md                # Документация
```

## 🎯 Шаг 1: Перенос проекта

### Вариант A: Копирование папки

```bash
# Из текущего проекта SMI
cp -r calendar-app /path/to/new/location/calendar-app
cd /path/to/new/location/calendar-app
```

### Вариант B: Git

```bash
# Создать новый репозиторий
cd calendar-app
git init
git add .
git commit -m "Initial commit: Calendar Publishing App"
git remote add origin <your-repo-url>
git push -u origin main
```

## 🔧 Шаг 2: Установка зависимостей

```bash
npm install
```

## 🗄️ Шаг 3: Настройка Vercel Postgres

1. Зайти на [vercel.com](https://vercel.com)
2. Создать новый проект
3. **Storage** → **Create Database** → **Postgres**
4. Скопировать переменные окружения

## 🔐 Шаг 4: Настройка Environment Variables

Создать файл `.env.local`:

```bash
cp .env.example .env.local
```

Заполнить **ВСЕ** переменные в `.env.local`:

```env
# Database (из Vercel Postgres)
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
# ... и остальные

# NextAuth
NEXTAUTH_URL="http://localhost:3000"  # для dev
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# API Integration
CALENDAR_API_KEY="your-secure-api-key"
SMI_PROJECT_URL="http://localhost:8000"

# Publishers (настроить позже)
WORDPRESS_SITE_URL=""
TELEGRAM_BOT_TOKEN=""
# ...
```

## 📊 Шаг 5: Инициализация базы данных

```bash
npm run db:push
```

Это создаст все таблицы в Vercel Postgres.

## 🧪 Шаг 6: Тестирование локально

```bash
npm run dev
```

Открыть `http://localhost:3000`

## 🌐 Шаг 7: Deploy на Vercel

### Через CLI:

```bash
npm install -g vercel
vercel login
vercel
```

### Через Dashboard:

1. Зайти на vercel.com
2. **New Project**
3. Импортировать репозиторий
4. Добавить Environment Variables (все из `.env.local`)
5. **Deploy**

## ⚙️ Шаг 8: Настройка Vercel Cron

После deploy:

1. Vercel Dashboard → **Cron Jobs**
2. Проверить, что есть job: `/api/cron/publish` каждые 15 минут
3. Добавить переменную `CRON_SECRET` в Environment Variables

## 🔗 Шаг 9: Интеграция с SMI проектом

В SMI проекте создать endpoint для отправки статей.

См. файл: `SMI_INTEGRATION_ENDPOINT.py` (будет создан отдельно)

## ✅ Проверка работоспособности

### 1. Проверить авторизацию
- Открыть `https://your-app.vercel.app/login`
- Войти с тестовыми данными

### 2. Проверить API
```bash
curl -X POST https://your-app.vercel.app/api/articles/receive \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content"}'
```

### 3. Проверить Calendar UI
- Открыть `/calendar`
- Проверить таблицу inbox
- Попробовать запланировать статью

### 4. Проверить Cron Job
- Vercel Dashboard → Cron Jobs → Logs
- Должен запускаться каждые 15 минут

## 🔧 Настройка платформ публикации

После deploy настроить credentials для каждой платформы:

### WordPress
1. Создать Application Password
2. Добавить `WORDPRESS_APP_PASSWORD` в Vercel

### Telegram
1. Создать бота через @BotFather
2. Добавить в канал как администратора
3. Добавить `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHANNEL_ID`

### Facebook
1. Создать Facebook App
2. Получить Page Access Token
3. Добавить credentials

### Instagram
1. Подключить Instagram Business Account
2. Получить Access Token
3. Добавить credentials

### LinkedIn
1. Создать LinkedIn App
2. Получить Access Token
3. Добавить credentials

## 📝 Стоимость Vercel

- **Hobby (Free)**:
  - Vercel Postgres: 256 MB (бесплатно)
  - Bandwidth: 100 GB/month
  - Cron Jobs: включены
  
- **Pro ($20/month)**:
  - Postgres: 512 MB
  - Больше requests
  - Подходит для продакшена

## 🐛 Troubleshooting

### База данных не инициализируется
```bash
# Проверить подключение
node -e "const {sql} = require('@vercel/postgres'); sql\`SELECT NOW()\`.then(r => console.log(r))"
```

### Cron job не работает
- Проверить `CRON_SECRET` в Environment Variables
- Проверить логи в Vercel Dashboard

### Ошибки публикации
- Проверить credentials для каждой платформы
- Проверить логи в таблице `publish_logs`

## 📞 Поддержка

Документация проекта: `/README.md`

---

**Готово!** 🎉

После завершения всех шагов Calendar App будет полностью автономным и готовым к работе на Vercel.
