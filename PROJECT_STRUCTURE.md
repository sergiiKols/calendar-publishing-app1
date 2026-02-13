# 📂 Calendar App - Полная структура проекта

## 🎯 Обзор

Calendar App - автономное Next.js приложение для планирования и автоматической публикации контента.

## 📁 Структура файлов

```
calendar-app/
│
├── 📦 Конфигурационные файлы
│   ├── package.json              # Зависимости и скрипты
│   ├── tsconfig.json             # TypeScript конфигурация
│   ├── next.config.js            # Next.js конфигурация
│   ├── tailwind.config.js        # TailwindCSS конфигурация
│   ├── postcss.config.js         # PostCSS конфигурация
│   ├── vercel.json               # Vercel deploy + Cron Jobs
│   ├── .env.example              # Пример переменных окружения
│   ├── .gitignore                # Git ignore
│   └── middleware.ts             # NextAuth защита маршрутов
│
├── 📄 Документация
│   ├── README.md                 # Основная документация
│   ├── DEPLOYMENT_GUIDE.md       # Гайд по развёртыванию
│   ├── SETUP_CHECKLIST.md        # Чеклист настройки
│   └── PROJECT_STRUCTURE.md      # Этот файл
│
├── 🎨 Frontend (app/)
│   ├── layout.tsx                # Корневой layout
│   ├── page.tsx                  # Главная страница (redirect to /login)
│   ├── globals.css               # Глобальные стили
│   │
│   ├── (auth)/                   # Группа маршрутов авторизации
│   │   └── login/
│   │       └── page.tsx          # Страница логина
│   │
│   ├── (dashboard)/              # Группа защищённых маршрутов
│   │   └── calendar/
│   │       └── page.tsx          # Главная страница календаря
│   │
│   └── api/                      # API Routes
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts      # NextAuth конфигурация
│       │
│       ├── articles/
│       │   ├── receive/
│       │   │   └── route.ts      # Приём статей из SMI
│       │   └── inbox/
│       │       └── route.ts      # Получение inbox статей
│       │
│       ├── calendar/
│       │   └── events/
│       │       └── route.ts      # CRUD календарных событий
│       │
│       └── cron/
│           └── publish/
│               └── route.ts      # Vercel Cron автопубликация
│
├── 🧩 Компоненты (components/)
│   ├── InboxTable.tsx            # Таблица входящих статей
│   ├── CalendarGrid.tsx          # Сетка календаря
│   └── ScheduleModal.tsx         # Модалка планирования
│
├── 🔧 Утилиты (lib/)
│   ├── db/
│   │   ├── schema.sql            # SQL схема базы данных
│   │   ├── init.js               # Скрипт инициализации БД
│   │   └── client.ts             # Database client (CRUD функции)
│   │
│   ├── publishers/               # Publishers для платформ
│   │   ├── wordpress.ts          # WordPress публикация
│   │   ├── telegram.ts           # Telegram публикация
│   │   ├── facebook.ts           # Facebook публикация
│   │   ├── instagram.ts          # Instagram публикация
│   │   └── linkedin.ts           # LinkedIn публикация
│   │
│   └── encryption.ts             # Шифрование токенов
│
└── 📁 Другое
    └── public/                   # Статические файлы
```

## 🗄️ База данных (Vercel Postgres)

### Таблицы:

1. **users** - Пользователи системы
2. **inbox_articles** - Входящие статьи из SMI
3. **calendar_events** - Запланированные публикации
4. **publishing_platforms** - Настройки аккаунтов соцсетей
5. **publish_logs** - История публикаций

## 🔌 API Endpoints

### Публичные (требуют API ключ):
- `POST /api/articles/receive` - Приём статей из SMI

### Защищённые (требуют авторизацию):
- `GET /api/articles/inbox` - Получить inbox статьи
- `GET /api/calendar/events` - Получить события календаря
- `POST /api/calendar/events` - Создать событие

### Cron Jobs:
- `GET /api/cron/publish` - Автопубликация (вызывается Vercel)

## 🚀 Команды

```bash
# Разработка
npm run dev              # Запуск dev сервера (localhost:3000)

# Production
npm run build           # Сборка для продакшена
npm run start           # Запуск production сервера

# База данных
npm run db:push         # Инициализация БД

# Деплой
vercel                  # Deploy на Vercel
vercel --prod           # Deploy в production
```

## 🔐 Environment Variables

### Обязательные:
- `POSTGRES_URL` - Vercel Postgres URL
- `NEXTAUTH_SECRET` - NextAuth секрет
- `NEXTAUTH_URL` - URL приложения
- `CALENDAR_API_KEY` - API ключ для приёма статей
- `CRON_SECRET` - Секрет для cron jobs
- `ENCRYPTION_KEY` - Ключ шифрования токенов

### Опциональные (для публикации):
- WordPress: `WORDPRESS_SITE_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD`
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`
- Facebook: `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`
- Instagram: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- LinkedIn: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_ID`

## 🔄 Workflow

```
1. SMI проект генерирует контент
   ↓
2. Отправка в Calendar App через API
   ↓
3. Статья попадает в inbox_articles (status: inbox)
   ↓
4. Пользователь планирует статью в календаре
   ↓
5. Создаётся calendar_event (status: pending)
   ↓ (статья status: scheduled)
6. Vercel Cron каждые 15 минут проверяет pending события
   ↓
7. Публикация на выбранные платформы
   ↓
8. Логирование результатов в publish_logs
   ↓
9. Обновление статусов (published/failed)
```

## 📊 Зависимости

### Production:
- `next` - Next.js framework
- `react` - React library
- `next-auth` - Аутентификация
- `@vercel/postgres` - Database client
- `bcryptjs` - Хеширование паролей
- `axios` - HTTP клиент для publishers
- `date-fns` - Работа с датами
- `lucide-react` - Иконки
- `react-hot-toast` - Уведомления
- `zod` - Валидация
- `sharp` - Обработка изображений

### Development:
- `typescript` - TypeScript
- `tailwindcss` - CSS framework
- `eslint` - Линтер

## 🎨 UI Компоненты

### InboxTable
- Отображает список статей из inbox
- Фильтрация по статусу
- Клик для открытия модалки планирования

### CalendarGrid
- Календарная сетка с событиями
- Навигация по месяцам
- Клик на событие показывает детали

### ScheduleModal
- Выбор даты и времени публикации
- Выбор платформ
- Подтверждение планирования

## 🔒 Безопасность

- ✅ NextAuth для аутентификации
- ✅ API ключи для endpoints
- ✅ Шифрование токенов в БД
- ✅ Защита cron jobs секретом
- ✅ Middleware для защищённых маршрутов

## 📈 Масштабируемость

- Легко добавить новые платформы (создать новый publisher)
- Можно добавить multi-user support
- Возможность расширения UI (аналитика, A/B тесты)
- Готов к горизонтальному масштабированию на Vercel

## 🎯 Next Steps

После базовой настройки можно добавить:
1. Страницу настроек платформ (UI для credentials)
2. Dashboard с аналитикой
3. Массовое планирование
4. A/B тестирование контента
5. Webhook уведомления
6. Интеграция с другими CMS

---

**Проект готов к переносу и deploy на Vercel!** 🚀
