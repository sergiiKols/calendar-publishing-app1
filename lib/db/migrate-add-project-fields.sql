-- ================================================
-- Migration: Add description and color to projects
-- ================================================

-- 1. Добавить колонку description
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Добавить колонку color
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- 3. Обновить существующие проекты (установить цвет по умолчанию)
UPDATE projects 
SET color = '#3B82F6' 
WHERE color IS NULL;

-- 4. Проверка
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('description', 'color', 'search_location_code')
ORDER BY column_name;
