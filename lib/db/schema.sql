-- ================================
-- CALENDAR APP - Database Schema
-- ================================

-- Таблица 1: Пользователи
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица 2: Входящие статьи из SMI проекта
CREATE TABLE IF NOT EXISTS inbox_articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'inbox', -- inbox, scheduled, published
  source_project VARCHAR(100), -- откуда пришла статья
  arrival_token VARCHAR(255), -- маркер прибытия статьи для обратной связи
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска по статусу
CREATE INDEX IF NOT EXISTS idx_inbox_status ON inbox_articles(status);

-- Таблица 3: События в календаре (запланированные публикации)
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES inbox_articles(id) ON DELETE CASCADE,
  publish_date DATE NOT NULL,
  publish_time TIME NOT NULL,
  platforms JSONB DEFAULT '[]', -- ["wordpress", "telegram", "facebook"]
  status VARCHAR(20) DEFAULT 'pending', -- pending, publishing, published, failed
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Индекс для быстрого поиска предстоящих публикаций
CREATE INDEX IF NOT EXISTS idx_calendar_datetime ON calendar_events(publish_date, publish_time);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON calendar_events(status);

-- Таблица 4: Платформы для публикации (аккаунты)
CREATE TABLE IF NOT EXISTS publishing_platforms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform_type VARCHAR(50) NOT NULL, -- wordpress, telegram, facebook, instagram, linkedin
  platform_name VARCHAR(100) NOT NULL, -- "Мой блог WordPress", "Канал новостей TG"
  credentials JSONB NOT NULL, -- зашифрованные токены/пароли
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска активных платформ
CREATE INDEX IF NOT EXISTS idx_platforms_active ON publishing_platforms(is_active, platform_type);

-- Таблица 5: Логи публикаций
CREATE TABLE IF NOT EXISTS publish_logs (
  id SERIAL PRIMARY KEY,
  calendar_event_id INTEGER REFERENCES calendar_events(id) ON DELETE CASCADE,
  platform_id INTEGER REFERENCES publishing_platforms(id) ON DELETE SET NULL,
  platform_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- success, failed
  error_message TEXT,
  published_url TEXT, -- URL опубликованной статьи
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска логов по событию
CREATE INDEX IF NOT EXISTS idx_logs_event ON publish_logs(calendar_event_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автообновления updated_at
CREATE TRIGGER update_inbox_articles_updated_at 
  BEFORE UPDATE ON inbox_articles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publishing_platforms_updated_at 
  BEFORE UPDATE ON publishing_platforms 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
