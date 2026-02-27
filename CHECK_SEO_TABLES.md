# ✅ Проверка таблиц SEO

## Шаг 1: Подключитесь к БД

```bash
# Через Docker
docker exec -it calendar-db psql -U calendar_user -d calendar_db

# Или через psql напрямую
psql -U calendar_user -d calendar_db
```

## Шаг 2: Проверьте наличие таблиц

```sql
-- Проверка всех SEO таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'seo_%'
ORDER BY table_name;
```

### Ожидаемый результат:

Должны быть эти 7 таблиц:
- seo_keywords
- seo_tasks
- seo_results
- seo_serp_positions
- seo_semantic_clusters
- seo_clusters
- seo_cluster_keywords

## Шаг 3: Если таблиц НЕТ - применить миграции

### Миграция 1: Базовые таблицы (4 таблицы)

```bash
docker exec -i calendar-db psql -U calendar_user -d calendar_db < lib/db/migrate-add-seo-keywords.sql
```

### Миграция 2: Семантические кластеры (3 таблицы)

```bash
docker exec -i calendar-db psql -U calendar_user -d calendar_db < lib/db/migrate-add-semantic-clusters.sql
```

## Шаг 4: Проверка после применения

```sql
-- Должно вернуть 7 таблиц
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'seo_%';
```

## Шаг 5: После применения миграций

1. Обновите страницу `/seo`
2. Ошибка 500 должна исчезнуть
3. Данные должны загружаться

---

**Вы применили миграции?**
- [ ] migrate-add-seo-keywords.sql
- [ ] migrate-add-semantic-clusters.sql
