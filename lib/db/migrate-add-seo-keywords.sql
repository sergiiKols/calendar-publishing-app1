-- ================================
-- SEO Keywords & DataForSEO Integration
-- Migration: Add SEO functionality
-- ================================

-- Таблица 1: Ключевые слова для анализа
CREATE TABLE IF NOT EXISTS seo_keywords (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'en', -- язык поиска (en, ru, etc.)
  location_code VARCHAR(50), -- код региона DataForSEO (2840=USA, 2643=Russia, etc.)
  location_name VARCHAR(100), -- название региона для UI (USA, Russia, etc.)
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_seo_keywords_project ON seo_keywords(project_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_user ON seo_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_status ON seo_keywords(status);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON seo_keywords(keyword);

-- Таблица 2: Задачи DataForSEO (для отслеживания асинхронных запросов)
CREATE TABLE IF NOT EXISTS seo_tasks (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES seo_keywords(id) ON DELETE CASCADE,
  endpoint_type VARCHAR(50) NOT NULL, -- keywords_data, serp_analysis, keyword_suggestions
  task_id VARCHAR(255), -- ID задачи от DataForSEO (если используется)
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Индексы для задач
CREATE INDEX IF NOT EXISTS idx_seo_tasks_keyword ON seo_tasks(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_tasks_status ON seo_tasks(status, endpoint_type);
CREATE INDEX IF NOT EXISTS idx_seo_tasks_task_id ON seo_tasks(task_id);

-- Таблица 3: Результаты от DataForSEO
CREATE TABLE IF NOT EXISTS seo_results (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES seo_keywords(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES seo_tasks(id) ON DELETE CASCADE,
  endpoint_type VARCHAR(50) NOT NULL, -- keywords_data, serp_analysis, keyword_suggestions
  result_data JSONB NOT NULL, -- полные данные от API
  
  -- Extracted metrics для быстрого доступа
  search_volume INTEGER,
  cpc DECIMAL(10, 2),
  competition DECIMAL(3, 2), -- 0.00 to 1.00
  difficulty INTEGER, -- keyword difficulty (0-100)
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для результатов
CREATE INDEX IF NOT EXISTS idx_seo_results_keyword ON seo_results(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_results_task ON seo_results(task_id);
CREATE INDEX IF NOT EXISTS idx_seo_results_type ON seo_results(endpoint_type);
CREATE INDEX IF NOT EXISTS idx_seo_results_data ON seo_results USING GIN (result_data);

-- Таблица 4: SERP результаты (топ позиции из выдачи)
CREATE TABLE IF NOT EXISTS seo_serp_positions (
  id SERIAL PRIMARY KEY,
  result_id INTEGER REFERENCES seo_results(id) ON DELETE CASCADE,
  keyword_id INTEGER REFERENCES seo_keywords(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  url TEXT,
  title TEXT,
  description TEXT,
  domain VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для SERP позиций
CREATE INDEX IF NOT EXISTS idx_serp_positions_result ON seo_serp_positions(result_id);
CREATE INDEX IF NOT EXISTS idx_serp_positions_keyword ON seo_serp_positions(keyword_id);
CREATE INDEX IF NOT EXISTS idx_serp_positions_domain ON seo_serp_positions(domain);

-- Триггер для автообновления updated_at в seo_keywords
CREATE TRIGGER update_seo_keywords_updated_at 
  BEFORE UPDATE ON seo_keywords 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Комментарии к таблицам
COMMENT ON TABLE seo_keywords IS 'Ключевые слова для анализа через DataForSEO API';
COMMENT ON TABLE seo_tasks IS 'Задачи отправленные в DataForSEO API (для отслеживания статуса)';
COMMENT ON TABLE seo_results IS 'Результаты анализа от DataForSEO API';
COMMENT ON TABLE seo_serp_positions IS 'Топ позиции из поисковой выдачи (SERP)';

-- Комментарии к важным полям
COMMENT ON COLUMN seo_keywords.location_code IS 'DataForSEO location code (2840=USA, 2643=Russia, 2124=Canada, etc.)';
COMMENT ON COLUMN seo_results.result_data IS 'Полный JSON ответ от DataForSEO API';
COMMENT ON COLUMN seo_results.search_volume IS 'Средний месячный объем поиска';
COMMENT ON COLUMN seo_results.cpc IS 'Cost Per Click в USD';
COMMENT ON COLUMN seo_results.competition IS 'Уровень конкуренции (0.00 - 1.00)';
