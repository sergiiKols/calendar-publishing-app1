# Миграция: Добавление направлений проектов

## ⚠️ ВАЖНО: Обязательная миграция БД

Для работы направлений проектов необходимо выполнить миграцию базы данных.

---

## 📋 Что делает миграция:

1. Создаёт таблицу `project_categories`
2. Добавляет поле `category_id` в `seo_keywords`
3. Добавляет поле `category_id` в `seo_semantic_clusters`
4. Создаёт индексы для быстрого поиска
5. Настраивает триггеры для автоматического обновления

---

## 🚀 Способы выполнения миграции:

### Вариант 1: SSH на сервер

```bash
# Подключиться к серверу
ssh user@your-server.com

# Перейти в папку проекта
cd /home/user/calendar-app

# Выполнить миграцию через Docker
docker-compose exec app node run-migration.js
```

### Вариант 2: Через Docker Compose напрямую

```bash
# На сервере
cd /home/user/calendar-app

# Выполнить SQL файл
docker-compose exec db psql -U postgres -d calendar_db -f /app/lib/db/migrate-add-project-categories.sql
```

### Вариант 3: Через psql напрямую к БД

```bash
# На сервере
psql -U postgres -d calendar_db -f lib/db/migrate-add-project-categories.sql
```

### Вариант 4: Через любой PostgreSQL клиент

Откройте файл `lib/db/migrate-add-project-categories.sql` и выполните его содержимое через:
- pgAdmin
- DBeaver
- TablePlus
- Любой другой SQL клиент

---

## ✅ Проверка успешного выполнения:

После выполнения миграции проверьте:

```sql
-- Проверка создания таблицы
SELECT COUNT(*) FROM project_categories;
-- Должно вернуть 0 (таблица пустая, но существует)

-- Проверка добавления поля
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'seo_keywords' 
  AND column_name = 'category_id';
-- Должно вернуть 'category_id'
```

---

## 🔧 Содержимое миграции:

Файл: `lib/db/migrate-add-project-categories.sql`

```sql
-- 1. Создание таблицы направлений
CREATE TABLE IF NOT EXISTS project_categories (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Индексы
CREATE INDEX IF NOT EXISTS idx_categories_project ON project_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON project_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON project_categories(project_id, sort_order);

-- 3. Добавление поля category_id в seo_keywords
ALTER TABLE seo_keywords 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES project_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_keywords_category ON seo_keywords(category_id);

-- 4. Добавление поля category_id в seo_semantic_clusters
ALTER TABLE seo_semantic_clusters 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES project_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clusters_category ON seo_semantic_clusters(category_id);

-- 5. Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_project_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_categories_updated_at
  BEFORE UPDATE ON project_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_project_categories_updated_at();
```

---

## 📝 После выполнения миграции:

1. ✅ Перезапустите приложение (если нужно)
2. ✅ Откройте проект в SEO модуле
3. ✅ В боковой панели появится "Направления проекта"
4. ✅ Создайте первое направление
5. ✅ Добавьте ключевые слова к направлению

---

## ❓ Проблемы?

### Ошибка: "relation already exists"
**Решение:** Миграция уже выполнена, всё в порядке!

### Ошибка: "permission denied"
**Решение:** Проверьте права пользователя БД

### Ошибка: "database does not exist"
**Решение:** Убедитесь, что подключаетесь к правильной БД

---

## 🆘 Нужна помощь?

Если миграция не выполняется, напишите:
- Какой способ использовали
- Полный текст ошибки
- Версию PostgreSQL

---

**После успешной миграции направления проектов будут полностью работать! 🎉**
