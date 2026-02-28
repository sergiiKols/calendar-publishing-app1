-- Миграция: добавление отсутствующих колонок в таблицу projects
-- Выполнить на production сервере

-- Добавляем колонку description, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'description'
    ) THEN
        ALTER TABLE projects ADD COLUMN description TEXT;
        RAISE NOTICE 'Added column: description';
    ELSE
        RAISE NOTICE 'Column description already exists';
    END IF;
END $$;

-- Добавляем колонку color, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'color'
    ) THEN
        ALTER TABLE projects ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
        RAISE NOTICE 'Added column: color';
    ELSE
        RAISE NOTICE 'Column color already exists';
    END IF;
END $$;

-- Добавляем колонку is_active, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE projects ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added column: is_active';
    ELSE
        RAISE NOTICE 'Column is_active already exists';
    END IF;
END $$;

-- Добавляем колонку external_project_id, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'external_project_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN external_project_id INTEGER;
        RAISE NOTICE 'Added column: external_project_id';
    ELSE
        RAISE NOTICE 'Column external_project_id already exists';
    END IF;
END $$;

-- Добавляем колонку synced_at, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'synced_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN synced_at TIMESTAMP;
        RAISE NOTICE 'Added column: synced_at';
    ELSE
        RAISE NOTICE 'Column synced_at already exists';
    END IF;
END $$;

-- Добавляем колонку updated_at, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added column: updated_at';
    ELSE
        RAISE NOTICE 'Column updated_at already exists';
    END IF;
END $$;

-- Добавляем индексы, если их нет
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_projects_external ON projects(external_project_id);

-- Добавляем триггер для автообновления updated_at, если его нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at'
    ) THEN
        CREATE TRIGGER update_projects_updated_at 
          BEFORE UPDATE ON projects 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger: update_projects_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_projects_updated_at already exists';
    END IF;
END $$;

-- Проверяем итоговую структуру таблицы
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;
