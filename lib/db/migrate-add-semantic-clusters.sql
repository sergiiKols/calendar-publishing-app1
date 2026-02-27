-- ================================
-- SEO Semantic Clusters Extension
-- Migration: Add semantic clustering support
-- ================================

-- Таблица 1: Семантические кластеры (главная запись о сборе семядра)
CREATE TABLE IF NOT EXISTS seo_semantic_clusters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- название кластера (обычно seed keywords)
  seeds JSONB NOT NULL, -- массив seed-ключевых слов
  language VARCHAR(10) NOT NULL,
  location_code VARCHAR(50) NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  total_keywords INTEGER DEFAULT 0,
  total_search_volume BIGINT DEFAULT 0,
  cluster_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  competitor_domain VARCHAR(255), -- домен конкурента если использовался
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для семантических кластеров
CREATE INDEX IF NOT EXISTS idx_semantic_clusters_user ON seo_semantic_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_semantic_clusters_project ON seo_semantic_clusters(project_id);
CREATE INDEX IF NOT EXISTS idx_semantic_clusters_status ON seo_semantic_clusters(status);

-- Таблица 2: Кластеры (группы ключевых слов по семантике)
CREATE TABLE IF NOT EXISTS seo_clusters (
  id SERIAL PRIMARY KEY,
  semantic_cluster_id INTEGER REFERENCES seo_semantic_clusters(id) ON DELETE CASCADE,
  cluster_id INTEGER NOT NULL, -- ID кластера из DBSCAN
  cluster_name TEXT NOT NULL, -- самое популярное ключевое слово
  dominant_intent VARCHAR(50), -- informational, transactional, commercial, navigational, local
  total_search_volume BIGINT DEFAULT 0,
  avg_keyword_difficulty INTEGER DEFAULT 0,
  keywords_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для кластеров
CREATE INDEX IF NOT EXISTS idx_clusters_semantic ON seo_clusters(semantic_cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_intent ON seo_clusters(dominant_intent);

-- Таблица 3: Ключевые слова в кластерах
CREATE TABLE IF NOT EXISTS seo_cluster_keywords (
  id SERIAL PRIMARY KEY,
  cluster_id INTEGER REFERENCES seo_clusters(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  cpc DECIMAL(10, 2) DEFAULT 0,
  competition DECIMAL(3, 2) DEFAULT 0,
  keyword_difficulty INTEGER DEFAULT 0,
  intent VARCHAR(50), -- informational, transactional, commercial, navigational, local
  source VARCHAR(50), -- seed, labs, related, competitor
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для ключевых слов кластера
CREATE INDEX IF NOT EXISTS idx_cluster_keywords_cluster ON seo_cluster_keywords(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_keywords_keyword ON seo_cluster_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_cluster_keywords_intent ON seo_cluster_keywords(intent);
CREATE INDEX IF NOT EXISTS idx_cluster_keywords_volume ON seo_cluster_keywords(search_volume DESC);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_semantic_clusters_updated_at 
  BEFORE UPDATE ON seo_semantic_clusters 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Комментарии к таблицам
COMMENT ON TABLE seo_semantic_clusters IS 'Семантические кластеры - основная запись о сборе семядра из seed-ключей';
COMMENT ON TABLE seo_clusters IS 'Кластеры - группы ключевых слов по семантическому сходству';
COMMENT ON TABLE seo_cluster_keywords IS 'Ключевые слова внутри кластеров с полными метриками';

-- Комментарии к важным полям
COMMENT ON COLUMN seo_semantic_clusters.seeds IS 'Массив seed-ключевых слов использованных для генерации (JSON array)';
COMMENT ON COLUMN seo_semantic_clusters.total_search_volume IS 'Суммарный объем поиска всех ключевых слов';
COMMENT ON COLUMN seo_semantic_clusters.cluster_count IS 'Количество созданных семантических кластеров';
COMMENT ON COLUMN seo_clusters.cluster_id IS 'ID кластера из алгоритма DBSCAN';
COMMENT ON COLUMN seo_clusters.dominant_intent IS 'Преобладающий интент в кластере';
COMMENT ON COLUMN seo_cluster_keywords.source IS 'Источник ключевого слова: seed, labs (Keywords for Keywords), related (Related Keywords), competitor (Keywords for Site)';
COMMENT ON COLUMN seo_cluster_keywords.intent IS 'Intent ключевого слова определенный через SERP анализ';

-- View для удобного просмотра всех данных кластера
CREATE OR REPLACE VIEW v_semantic_clusters_full AS
SELECT 
  sc.id as semantic_cluster_id,
  sc.name as cluster_name,
  sc.seeds,
  sc.language,
  sc.location_name,
  sc.total_keywords,
  sc.total_search_volume,
  sc.cluster_count,
  sc.status,
  sc.created_at,
  p.name as project_name,
  u.email as user_email,
  c.id as cluster_id,
  c.cluster_name as group_name,
  c.dominant_intent,
  c.total_search_volume as group_search_volume,
  c.avg_keyword_difficulty as group_difficulty,
  c.keywords_count,
  ck.keyword,
  ck.search_volume,
  ck.cpc,
  ck.competition,
  ck.keyword_difficulty,
  ck.intent,
  ck.source
FROM seo_semantic_clusters sc
LEFT JOIN users u ON sc.user_id = u.id
LEFT JOIN projects p ON sc.project_id = p.id
LEFT JOIN seo_clusters c ON sc.id = c.semantic_cluster_id
LEFT JOIN seo_cluster_keywords ck ON c.id = ck.cluster_id;

COMMENT ON VIEW v_semantic_clusters_full IS 'Полное представление семантических кластеров со всеми ключевыми словами';

-- Статистика по интентам (материализованное представление можно создать позже для production)
CREATE OR REPLACE VIEW v_intent_statistics AS
SELECT 
  sc.id as semantic_cluster_id,
  sc.name,
  ck.intent,
  COUNT(ck.id) as keywords_count,
  SUM(ck.search_volume) as total_search_volume,
  AVG(ck.keyword_difficulty) as avg_difficulty,
  AVG(ck.cpc) as avg_cpc
FROM seo_semantic_clusters sc
JOIN seo_clusters c ON sc.id = c.semantic_cluster_id
JOIN seo_cluster_keywords ck ON c.id = ck.cluster_id
GROUP BY sc.id, sc.name, ck.intent
ORDER BY sc.id, total_search_volume DESC;

COMMENT ON VIEW v_intent_statistics IS 'Статистика распределения ключевых слов по интентам';
