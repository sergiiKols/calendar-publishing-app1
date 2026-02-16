-- ================================
-- МИГРАЦИЯ: Добавление синхронизации проектов с SMI
-- Дата: 2026-02-16
-- ================================

-- Добавление external_project_id в projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS external_project_id INTEGER;

-- Добавление synced_at в projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;

-- Создание уникального индекса для external_project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_external_unique 
ON projects(external_project_id) 
WHERE external_project_id IS NOT NULL;

-- Обновление существующего индекса
DROP INDEX IF EXISTS idx_projects_external;
CREATE INDEX IF NOT EXISTS idx_projects_external ON projects(external_project_id);

-- Комментарии
COMMENT ON COLUMN projects.external_project_id IS 'ID проекта в SMI системе (если синхронизирован)';
COMMENT ON COLUMN projects.synced_at IS 'Время последней синхронизации с SMI';
