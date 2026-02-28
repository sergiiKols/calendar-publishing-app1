# 🚀 Инструкция по деплою исправлений

## Проблема
База данных на production имеет обязательные колонки, которых нет в локальной версии:
- `smi_project_id` (NOT NULL)
- `api_token` (NOT NULL)

## Решение

### Вариант 1: Обновить код (рекомендуется)

Код уже содержит fallback логику для работы с любой версией схемы БД.

```bash
# На production сервере
cd /path/to/calendar-app
git pull origin main
npm install
npm run build
pm2 restart calendar-app
# или
docker-compose restart
```

### Вариант 2: Выполнить миграцию БД

Сделать колонки nullable:

```bash
# Подключитесь к PostgreSQL
psql $DATABASE_URL

# Выполните:
\i lib/db/migrate-add-missing-columns.sql
```

Или вручную:

```sql
ALTER TABLE projects ALTER COLUMN smi_project_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN api_token DROP NOT NULL;
```

---

## Проверка

После деплоя:
1. Откройте `/calendar/seo`
2. Нажмите "Добавить ключевые слова"
3. Создайте новый проект
4. ✅ Должно работать без ошибок

---

## Коммиты с исправлениями

- `4982d23` - Wizard интерфейс
- `7779659` - Fix селектов языка/локации
- `068bca5` - Handle missing description
- `626aac0` - Cascading fallback для колонок
- `bd9aff8` - Handle smi_project_id NOT NULL
- `c4b691e` - Handle api_token NOT NULL ⭐ **ПОСЛЕДНИЙ**

---

## Текущая логика fallback

```
1. TRY: INSERT (user_id, name, description, color)
2. TRY: INSERT (user_id, name, color)
3. TRY: INSERT (user_id, name)
4. TRY: INSERT (user_id, name, smi_project_id=0)
5. TRY: INSERT (user_id, name, smi_project_id=0, api_token='')
```

Код адаптируется к любой версии схемы БД!
