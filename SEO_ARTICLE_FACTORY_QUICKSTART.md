# 🚀 Quick Start - SEO Article Factory

## Быстрый запуск за 5 минут

### 1. Установка зависимостей
```bash
npm install @tanstack/react-table react-markdown remark-gfm react-big-calendar @dnd-kit/core framer-motion date-fns clsx tailwind-merge lucide-react usehooks-ts
```

### 2. Environment Variables (.env.local)
```bash
# Qwen API
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# DataForSEO (уже должны быть)
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

**Получить Qwen API Key:**
- Регистрация: https://dashscope.console.aliyun.com/
- Создать API Key → Пополнить баланс (¥10 ≈ $1.50)

### 3. Миграция БД
```bash
# Выполнить SQL из файла:
# lib/db/migrate-article-factory.sql
# через Supabase Dashboard → SQL Editor
```

### 4. Структура файлов для создания

Смотри полный план в `SEO_ARTICLE_FACTORY_PLAN.md` (1842 строки)

**Основные файлы:**
- `app/seo-writer/page.tsx` - Main Wizard
- `lib/qwen/client.ts` - Qwen API
- `hooks/useArticleFactory.ts` - State management
- `app/api/seo-writer/*` - 5 API endpoints

### 5. Тестирование
```bash
npm run dev
# Открыть http://localhost:3000/seo-writer
```

---

**📖 Полная документация:** `SEO_ARTICLE_FACTORY_PLAN.md`

**💰 Стоимость:** ~$0.24 за статью (2500 слов)  
**⏱️ Время:** 1-2 минуты на статью  
**🎯 Качество:** SERP-оптимизированный контент
