-- Миграция: Добавление направлений (категорий) в проекты
-- Дата: 2026-02-28

-- 1. Создаём таблицу направлений
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

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_categories_project ON project_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON project_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON project_categories(project_id, sort_order);

-- 2. Добавляем поле category_id в таблицу seo_keywords
ALTER TABLE seo_keywords 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES project_categories(id) ON DELETE SET NULL;

-- Индекс для category_id
CREATE INDEX IF NOT EXISTS idx_keywords_category ON seo_keywords(category_id);

-- 3. Триггер для автоматического обновления updated_at
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

-- 4. Добавляем category_id в semantic clusters тоже
ALTER TABLE seo_semantic_clusters 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES project_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clusters_category ON seo_semantic_clusters(category_id);

-- Готово!
-- Теперь структура:
-- Project → Categories → Keywords
-- Project → Categories → Semantic Clusters
