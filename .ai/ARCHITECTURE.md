# 🏗️ System Architecture

**Project**: Calendar Publishing App  
**Last Updated**: 2026-02-16

---

## 📐 System Overview

Calendar Publishing App - это full-stack приложение на Next.js 14 для автоматизации публикаций в социальные сети и блоги.

```
┌─────────────────┐
│   SMI Project   │
│  (External API) │
└────────┬────────┘
         │ POST /api/articles/receive
         ▼
┌─────────────────────────────────────┐
│       Calendar Publishing App        │
│  ┌──────────────────────────────┐   │
│  │   Next.js 14 Frontend        │   │
│  │   - React 18                 │   │
│  │   - TailwindCSS              │   │
│  │   - Drag & Drop Calendar     │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Next.js API Routes         │   │
│  │   - /api/articles/*          │   │
│  │   - /api/calendar/*          │   │
│  │   - /api/cron/*              │   │
│  │   - /api/auth/*              │   │
│  └──────────────────────────────┘   │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│      Vercel Postgres Database       │
│  - users                            │
│  - inbox_articles                   │
│  - calendar_events                  │
│  - publishing_platforms             │
│  - publish_logs                     │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│        Vercel Cron Jobs             │
│  Every 15 min: /api/cron/publish    │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│    Publishing Platforms             │
│  - WordPress                        │
│  - Telegram                         │
│  - Facebook                         │
│  - Instagram                        │
│  - LinkedIn                         │
└─────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
calendar-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group routes
│   │   └── login/               
│   │       └── page.tsx          # Login page
│   ├── (dashboard)/              # Dashboard group routes
│   │   └── calendar/            
│   │       └── page.tsx          # Main calendar UI
│   ├── api/                      # API Routes
│   │   ├── articles/            
│   │   │   ├── inbox/           
│   │   │   │   └── route.ts      # GET inbox articles
│   │   │   └── receive/         
│   │   │       └── route.ts      # POST receive from SMI
│   │   ├── auth/                
│   │   │   └── [...nextauth]/   
│   │   │       └── route.ts      # NextAuth config
│   │   ├── calendar/            
│   │   │   └── events/          
│   │   │       └── route.ts      # CRUD calendar events
│   │   ├── cron/                
│   │   │   └── publish/         
│   │   │       └── route.ts      # Auto-publish job
│   │   └── db/                  
│   │       └── migrate/         
│   │           └── route.ts      # Manual migrations
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home/redirect
│
├── components/                   # React Components
│   ├── ArticleViewModal.tsx      # View article details
│   ├── CalendarGrid.tsx          # Main calendar grid
│   ├── InboxTable.tsx            # Inbox articles table
│   └── ScheduleModal.tsx         # Schedule publication modal
│
├── lib/                          # Utilities & Logic
│   ├── db/                       # Database
│   │   ├── client.ts             # Postgres client
│   │   ├── init.js               # DB initialization
│   │   ├── migrate.js            # Migration runner
│   │   ├── schema.sql            # Main schema
│   │   └── migrate-*.sql         # Migration files
│   ├── publishers/               # Platform integrations
│   │   ├── facebook.ts          
│   │   ├── instagram.ts         
│   │   ├── linkedin.ts          
│   │   ├── telegram.ts          
│   │   └── wordpress.ts         
│   └── encryption.ts             # Token encryption
│
├── public/                       # Static assets
├── next.config.js                # Next.js config
├── tailwind.config.js            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── vercel.json                   # Vercel + Cron config
└── package.json                  # Dependencies
```

---

## 🔄 Data Flow

### 1. Article Reception (from SMI)
```
SMI Project
    ↓ POST /api/articles/receive
    ↓ (X-API-Key validation)
Database: INSERT into inbox_articles
    ↓ status = 'inbox'
Frontend: InboxTable shows new article
```

### 2. Manual Scheduling
```
User drags article to calendar date
    ↓ ScheduleModal opens
    ↓ User selects platforms, time
    ↓ POST /api/calendar/events
Database: 
    - INSERT into calendar_events
    - UPDATE inbox_articles.status = 'scheduled'
Frontend: CalendarGrid updates
```

### 3. Auto-Publishing (Cron)
```
Vercel Cron (every 15 min)
    ↓ GET /api/cron/publish
    ↓ (X-Cron-Secret validation)
Query: SELECT events WHERE publish_at <= NOW()
    ↓ For each event:
    ↓ Get platform credentials (decrypt)
    ↓ Call publisher (wordpress.ts, telegram.ts, etc.)
    ↓ Log result in publish_logs
    ↓ UPDATE event.status = 'published'
    ↓ UPDATE article.status = 'published'
```

---

## 🗃️ Database Schema

### Table: `users`
```sql
id SERIAL PRIMARY KEY
email VARCHAR(255) UNIQUE
password_hash TEXT
created_at TIMESTAMP
```

### Table: `inbox_articles`
```sql
id SERIAL PRIMARY KEY
title TEXT
content TEXT
images TEXT[]
source_project VARCHAR(100)
status VARCHAR(20)  -- 'inbox', 'scheduled', 'published'
arrived_at TIMESTAMP
arrival_token TEXT  -- для идентификации отправителя
```

### Table: `calendar_events`
```sql
id SERIAL PRIMARY KEY
article_id INTEGER REFERENCES inbox_articles(id)
publish_at TIMESTAMP
platforms TEXT[]  -- ['wordpress', 'telegram']
status VARCHAR(20)  -- 'scheduled', 'published', 'failed'
created_by INTEGER REFERENCES users(id)
```

### Table: `publishing_platforms`
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id)
platform VARCHAR(50)  -- 'wordpress', 'telegram', etc.
account_name VARCHAR(255)
credentials_encrypted TEXT  -- JSON with tokens
is_active BOOLEAN
```

### Table: `publish_logs`
```sql
id SERIAL PRIMARY KEY
event_id INTEGER REFERENCES calendar_events(id)
platform VARCHAR(50)
status VARCHAR(20)  -- 'success', 'failed'
response TEXT
published_at TIMESTAMP
error_message TEXT
```

---

## 🔐 Security Architecture

### Authentication Flow
```
User → Login Page → POST /api/auth/signin
    ↓ NextAuth.js
    ↓ Validate credentials
    ↓ Create session
    ↓ Set cookie
Protected pages check session → Redirect if not authenticated
```

### API Protection
```
External API calls → X-API-Key header validation
Cron jobs → X-Cron-Secret header validation
Internal API → NextAuth session validation
```

### Token Encryption
```
User enters platform token → 
    ↓ encrypt(token, ENCRYPTION_KEY)
    ↓ Store in publishing_platforms.credentials_encrypted
When publishing →
    ↓ decrypt(credentials_encrypted, ENCRYPTION_KEY)
    ↓ Use for API calls
```

---

## 📊 Component Architecture

### Frontend Components Hierarchy
```
app/layout.tsx
├── app/(auth)/login/page.tsx
│   └── LoginForm
└── app/(dashboard)/calendar/page.tsx
    ├── InboxTable
    │   ├── ArticleRow
    │   └── ArticleViewModal
    └── CalendarGrid
        ├── CalendarHeader
        ├── CalendarDays
        │   └── EventCard
        └── ScheduleModal
            ├── PlatformSelector
            ├── DateTimePicker
            └── PreviewPanel
```

---

## 🔌 External Integrations

### 1. WordPress
- **Method**: XML-RPC или REST API
- **Auth**: App Password
- **File**: `lib/publishers/wordpress.ts`

### 2. Telegram
- **Method**: Bot API
- **Auth**: Bot Token
- **File**: `lib/publishers/telegram.ts`

### 3. Facebook
- **Method**: Graph API
- **Auth**: Page Access Token
- **File**: `lib/publishers/facebook.ts`

### 4. Instagram
- **Method**: Graph API (через Facebook)
- **Auth**: Instagram Business Account Token
- **File**: `lib/publishers/instagram.ts`

### 5. LinkedIn
- **Method**: REST API v2
- **Auth**: OAuth 2.0 Access Token
- **File**: `lib/publishers/linkedin.ts`

---

## 🚀 Deployment Architecture

### Vercel Platform
```
GitHub Repository
    ↓ git push
Vercel Auto-Deploy
    ↓ Build & Deploy
    ↓ Environment Variables from Vercel Dashboard
Production URL
    ↓ Connected to Vercel Postgres
    ↓ Cron Jobs activated
```

### Environment Variables (Vercel)
- `NEXTAUTH_URL` - App URL
- `NEXTAUTH_SECRET` - Auth secret
- `POSTGRES_URL` - Database connection
- `CALENDAR_API_KEY` - API key for SMI
- `CRON_SECRET` - Cron job secret
- `ENCRYPTION_KEY` - Token encryption key

---

## 📈 Performance Considerations

### Database Indexing
```sql
CREATE INDEX idx_articles_status ON inbox_articles(status);
CREATE INDEX idx_events_publish_at ON calendar_events(publish_at);
CREATE INDEX idx_events_status ON calendar_events(status);
```

### Caching Strategy
- Static pages: Next.js automatic caching
- API routes: No caching (real-time data)
- Images: Vercel CDN

### Rate Limiting
- API endpoints: Implement rate limiting per IP
- Cron jobs: Built-in Vercel limits

---

## 🧪 Testing Strategy

### Unit Tests
- Database utilities
- Encryption/decryption
- Publisher modules

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- Complete publishing flow
- Calendar drag & drop
- Multi-platform publishing

---

**Last Updated**: 2026-02-16  
**Next Review**: After architecture changes
