# ✅ ЧЕКЛИСТ РЕАЛИЗАЦИИ - SEO Article Factory

## Фаза 1: Подготовка окружения (30 мин)

- [ ] **1.1 NPM пакеты**
  ```bash
  npm install @tanstack/react-table react-markdown remark-gfm react-big-calendar @dnd-kit/core @dnd-kit/sortable framer-motion date-fns clsx tailwind-merge lucide-react usehooks-ts
  npm install -D @types/react-big-calendar
  ```

- [ ] **1.2 Qwen API Key**
  - Зарегистрироваться: https://dashscope.console.aliyun.com/
  - Создать API Key
  - Пополнить баланс (минимум ¥10 ≈ $1.50)
  - Добавить в `.env.local`:
    ```
    QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

- [ ] **1.3 Database Migration**
  - Открыть Supabase Dashboard → SQL Editor
  - Скопировать SQL из `SEO_ARTICLE_FACTORY_PLAN.md` (секция "Database Schema")
  - Выполнить миграцию
  - Проверить создание таблиц: `article_generation_sessions`, `generated_articles`

---

## Фаза 2: Backend (2-3 часа)

- [ ] **2.1 Qwen Client** (`lib/qwen/client.ts`)
  - Скопировать код из плана
  - Тестировать: `curl` запрос к Qwen API

- [ ] **2.2 Qwen Prompts** (`lib/qwen/prompts.ts`)
  - Скопировать prompt templates

- [ ] **2.3 SEO Analyzer**
  - `lib/seo-analyzer/keyword-density.ts`
  - `lib/seo-analyzer/readability.ts`

- [ ] **2.4 API Routes** (5 файлов в `app/api/seo-writer/`)
  - [ ] `session/route.ts` (GET, POST, PATCH)
  - [ ] `serp-analysis/route.ts` (POST)
  - [ ] `generate-outline/route.ts` (POST)
  - [ ] `generate-sections/route.ts` (POST)
  - [ ] `optimize/route.ts` (POST)

---

## Фаза 3: Frontend (3-4 часа)

- [ ] **3.1 Hook** (`hooks/useArticleFactory.ts`)
  - State management для wizard
  - Supabase Realtime subscriptions

- [ ] **3.2 UI Components**
  - [ ] `components/WizardProgress.tsx`
  - [ ] `components/BudgetTracker.tsx` (обновить существующий)
  - [ ] `components/SectionPreview.tsx`

- [ ] **3.3 Main Wizard** (`app/seo-writer/page.tsx`)
  - Layout с прогресс-баром
  - Динамическая загрузка шагов

- [ ] **3.4 Step Components** (6 файлов в `app/seo-writer/components/`)
  - [ ] `Step1ClusterSelect.tsx`
  - [ ] `Step2SerpAnalysis.tsx`
  - [ ] `Step3OutlineGen.tsx`
  - [ ] `Step4SectionWriter.tsx`
  - [ ] `Step5Optimization.tsx`
  - [ ] `Step6Calendar.tsx`

---

## Фаза 4: Тестирование (1 час)

- [ ] **4.1 API тестирование**
  - [ ] Qwen connection test
  - [ ] DataForSEO SERP test
  - [ ] Session CRUD operations

- [ ] **4.2 UI тестирование**
  - [ ] Загрузка кластеров (Step 1)
  - [ ] SERP analysis (Step 2)
  - [ ] Outline generation (Step 3)
  - [ ] Batch section writing (Step 4)
  - [ ] SEO optimization (Step 5)
  - [ ] Calendar integration (Step 6)

- [ ] **4.3 Budget tracking**
  - [ ] Real-time обновления
  - [ ] Правильный расчёт стоимости

---

## Фаза 5: Deployment (30 мин)

- [ ] **5.1 Environment Variables**
  - Vercel/Dokploy Dashboard:
    ```
    QWEN_API_KEY=sk-xxx
    DATAFORSEO_LOGIN=xxx
    DATAFORSEO_PASSWORD=xxx
    QWEN_BUDGET_LIMIT=5.00
    DATAFORSEO_BUDGET_LIMIT=42.00
    ```

- [ ] **5.2 Deploy**
  ```bash
  git add .
  git commit -m "feat: Add SEO Article Factory"
  git push origin main
  vercel --prod
  ```

- [ ] **5.3 Post-deploy check**
  - [ ] Открыть https://your-domain.com/seo-writer
  - [ ] Проверить работу всех шагов
  - [ ] Сгенерировать тестовую статью

---

## 📊 Финальная проверка

- [ ] Статья генерируется за 1-2 минуты
- [ ] Budget tracker показывает правильную стоимость (~$0.24)
- [ ] Статья добавляется в календарь
- [ ] Export MD/HTML работает
- [ ] SEO metrics корректны

---

## 🎯 ГОТОВО!

Поздравляю! SEO Article Factory запущен и готов к работе.

**Следующие шаги:**
1. Загрузить семантическое ядро (если ещё не загружено)
2. Сгенерировать первые 5 статей
3. Запланировать публикацию в календаре
4. Мониторить budget usage

**Документация:**
- Полный план: `SEO_ARTICLE_FACTORY_PLAN.md`
- Быстрый старт: `SEO_ARTICLE_FACTORY_QUICKSTART.md`
