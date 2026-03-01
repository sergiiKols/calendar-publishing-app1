-- ================================
-- Migration: Add search_location_code to projects
-- ================================
-- Добавляет поле для хранения региона поиска DataForSEO на уровне проекта
-- Каждый проект теперь имеет свой регион для SEO-запросов

-- Добавляем поле search_location_code
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS search_location_code INTEGER DEFAULT 2840;

-- Комментарий для поля
COMMENT ON COLUMN projects.search_location_code IS 'DataForSEO location code for SEO searches (e.g., 2840=USA, 2144=Sri Lanka)';

-- Добавляем индекс для быстрого поиска проектов по региону
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(search_location_code);

-- Обновляем существующие проекты (если есть)
-- По умолчанию ставим USA (2840), можно будет изменить в UI
UPDATE projects 
SET search_location_code = 2840 
WHERE search_location_code IS NULL;

-- Проверка миграции
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'search_location_code'
  ) THEN
    RAISE NOTICE 'Migration successful: search_location_code added to projects table';
  ELSE
    RAISE EXCEPTION 'Migration failed: search_location_code not found in projects table';
  END IF;
END $$;
