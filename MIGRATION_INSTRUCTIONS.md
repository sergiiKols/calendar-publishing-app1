# 🔧 Инструкция по запуску миграции базы данных

## Проблема
База данных не содержит колонку `arrival_token` в таблице `inbox_articles`.

## Решение

### Шаг 1: Дождитесь завершения деплоя
После `git push` подождите **2-3 минуты**, пока Vercel задеплоит изменения.

Проверить статус можно здесь:
https://vercel.com/sergiis-projects-48df2a28/calendar-app/deployments

### Шаг 2: Запустите миграцию

Откройте в браузере URL:

```
https://calendar-app-gamma-puce.vercel.app/api/db/migrate?secret=YOUR_SECRET
```

Замените `YOUR_SECRET` на:
- Значение `CALENDAR_API_KEY` из Vercel Environment Variables
- Или любой другой секрет, если CALENDAR_API_KEY не настроен

**Пример:**
```
https://calendar-app-gamma-puce.vercel.app/api/db/migrate?secret=test123
```

### Шаг 3: Проверьте результат

**Успешный ответ:**
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "changes": ["Added arrival_token column to inbox_articles table"]
}
```

**Ошибка авторизации (401):**
```json
{
  "error": "Unauthorized"
}
```
→ Измените параметр `secret` в URL

**Ошибка базы данных (500):**
```json
{
  "error": "Failed to run migration",
  "details": "..."
}
```
→ Проверьте переменные окружения `POSTGRES_URL` в Vercel

### Шаг 4: Проверьте работу

После успешной миграции попробуйте отправить статью из SMI проекта.

Ошибка `column "arrival_token" does not exist` должна исчезнуть.

---

## Альтернативный способ (через Vercel SQL Dashboard)

1. Откройте Vercel Dashboard → Storage → ваша БД → Query
2. Выполните SQL:

```sql
ALTER TABLE inbox_articles ADD COLUMN arrival_token VARCHAR(255);
```

3. Готово!

---

## Проверка успешности миграции

Выполните в Vercel SQL Query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inbox_articles';
```

Вы должны увидеть `arrival_token` в списке колонок.
