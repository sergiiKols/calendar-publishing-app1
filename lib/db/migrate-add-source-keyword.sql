-- ================================================
-- Migration: Add source_keyword_id to seo_keywords
-- ================================================

-- 1. Добавить колонку source_keyword_id
ALTER TABLE seo_keywords 
ADD COLUMN IF NOT EXISTS source_keyword_id INTEGER;

-- 2. Добавить foreign key constraint (опционально)
-- ALTER TABLE seo_keywords 
-- ADD CONSTRAINT fk_source_keyword 
-- FOREIGN KEY (source_keyword_id) 
-- REFERENCES seo_keywords(id) 
-- ON DELETE SET NULL;

-- 3. Создать индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_seo_keywords_source 
ON seo_keywords(source_keyword_id);

-- 4. Проверка
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'seo_keywords' 
AND column_name = 'source_keyword_id';
