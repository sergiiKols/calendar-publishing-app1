# 📸 Project Snapshot

**Last Updated**: 2026-02-16  
**Version**: 1.0.0  
**Status**: ✅ Active Development

---

## 🎯 Project Description

**Calendar Publishing App** - Автоматическая система планирования и публикации контента в социальные сети и блоги через календарь.

### Key Features:
- Приём статей из SMI проекта через API
- Визуальный календарь с drag & drop планированием
- Автоматическая публикация по расписанию (Vercel Cron)
- Поддержка платформ: WordPress, Telegram, Facebook, Instagram, LinkedIn
- Управление несколькими аккаунтами
- Безопасное хранение токенов (шифрование)

---

## ✅ Current State

### **1. Backend/API**
- **Technology**: Next.js 14 API Routes
- **Port**: 3000 (dev), Vercel (prod)
- **Status**: ✅ Working
- **Health Check**: `curl http://localhost:3000/api/health`

### **2. Frontend**
- **Technology**: Next.js 14 (App Router), React 18, TailwindCSS
- **Port**: 3000
- **Status**: ✅ Working
- **URL**: `http://localhost:3000`

### **3. Database**
- **Type**: Vercel Postgres
- **Status**: ✅ Working
- **Location**: Vercel Cloud

### **4. Additional Services**
- Vercel Cron: Автопубликация каждые 15 минут
- NextAuth.js: Аутентификация пользователей
- Encryption: Шифрование токенов

---

## 📊 Architecture Overview

```
calendar-app/
├── app/                  # Next.js App Router
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Main app pages
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # React components
├── lib/                 # Utilities
│   ├── db/             # Database client & migrations
│   └── publishers/     # Platform integrations
└── public/             # Static assets
```

---

## 🔄 Business Processes

### Process 1: Приём статей
```
SMI Project → POST /api/articles/receive → Inbox Table → Manual Review
```

### Process 2: Планирование публикации
```
User drag-and-drop → Calendar Event → Database → Cron Job → Auto-publish
```

### Process 3: Автопубликация
```
Vercel Cron (every 15 min) → Check scheduled events → Publish to platforms → Log results
```

---

## 🆕 Recent Changes

**2026-02-16:**
- Проект активно разрабатывается
- Настроена базовая структура
- Добавлены API endpoints для приёма статей

---

## 🗄️ Database Schema

### Main Tables:
- `users` - Аутентификация пользователей
- `inbox_articles` - Входящие статьи (статусы: inbox, scheduled, published)
- `calendar_events` - Запланированные публикации
- `publishing_platforms` - Настройки аккаунтов соцсетей (шифрованные токены)
- `publish_logs` - История публикаций и логи ошибок

---

## 🚀 How to Run

### Start All Services:
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database
npm run db:push

# Start development server
npm run dev
```

### Verify Status:
```bash
# Check if app is running
curl http://localhost:3000

# Check API endpoint
curl http://localhost:3000/api/articles/inbox
```

---

## 🛠️ Tech Stack

### Backend:
- Language: TypeScript
- Framework: Next.js 14 (App Router)
- Database ORM: @vercel/postgres (SQL)

### Frontend:
- Language: TypeScript
- Framework: Next.js 14 / React 18
- UI Library: TailwindCSS, Lucide React
- Drag & Drop: react-beautiful-dnd

### Infrastructure:
- Hosting: Vercel
- CI/CD: Vercel Auto-deploy
- Cron: Vercel Cron Jobs

---

## ⚠️ Known Issues

### Current:
- Требуется настройка .env.local для локального запуска
- Нужна миграция БД при первом запуске

### Resolved:
- ✅ 2026-02-16: Базовая структура создана

---

## 📝 Important Files

- `vercel.json` - Vercel configuration + Cron jobs
- `.env.local` - Environment variables (DON'T commit!)
- `lib/db/schema.sql` - Database schema
- `lib/encryption.ts` - Token encryption utilities
- `README.md` - Project overview

---

## 🔐 Security Notes

### Secrets (DON'T commit):
- API keys in `.env.local`
- `NEXTAUTH_SECRET` in `.env.local`
- `CALENDAR_API_KEY` in `.env.local`
- `CRON_SECRET` in `.env.local`
- Platform tokens stored encrypted in DB

### Security Features:
- NextAuth.js for authentication
- Encrypted token storage
- API key protection on endpoints
- Cron job secret validation

---

**Last Updated**: 2026-02-16  
**Next Review**: After next major change
