-- ================================
-- МИГРАЦИЯ: Добавление системы проектов
-- Дата: 2026-02-16
-- ================================

-- Создание таблицы проектов
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- hex color для UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска проектов пользователя
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, is_active);

-- Добавление project_id в calendar_events
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

-- Индекс для фильтрации событий по проекту
CREATE INDEX IF NOT EXISTS idx_calendar_project ON calendar_events(project_id);

-- Триггер для автообновления updated_at в projects
CREATE TRIGGER IF NOT EXISTS update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание дефолтного проекта для существующих пользователей
-- (если есть события без project_id, создаём проект "Default")
DO $$
BEGIN
  -- Для каждого пользователя создаём дефолтный проект
  INSERT INTO projects (user_id, name, description, color)
  SELECT DISTINCT u.id, 'Default Project', 'Автоматически созданный проект', '#3B82F6'
  FROM users u
  WHERE NOT EXISTS (SELECT 1 FROM projects WHERE user_id = u.id);
  
  -- Привязываем все существующие события к дефолтному проекту пользователя
  UPDATE calendar_events ce
  SET project_id = p.id
  FROM projects p
  JOIN users u ON p.user_id = u.id
  WHERE ce.project_id IS NULL
  AND p.name = 'Default Project';
END $$;

-- Комментарии для документации
COMMENT ON TABLE projects IS 'Проекты пользователей. Каждый календарь привязан к проекту';
COMMENT ON COLUMN projects.color IS 'Hex код цвета для отображения в UI (#RRGGBB)';
COMMENT ON COLUMN calendar_events.project_id IS 'FK к таблице projects. Каждое событие принадлежит проекту';
