# 🔄 Интеграция синхронизации проектов SMI → Calendar

## Изменения в архитектуре

Теперь **проекты создаются только в SMI**, а календарь их синхронизирует автоматически.

---

## 📝 Что изменить в SMI проекте

### 1. Обновить endpoint отправки статьи в календарь

**Файл:** `C:\Users\User\Desktop\smi\api_server.py`

**Найти:**
```python
@app.post("/api/articles/ready-texts/{ready_text_id}/send-to-calendar")
async def send_article_to_calendar(ready_text_id: int, request: Request):
```

**В части формирования payload добавить:**

```python
# Получаем информацию о проекте статьи
project_id = article.get('project_id')
project_name = None

if project_id:
    # Получаем название проекта из БД
    project_cursor = conn.cursor()
    project_cursor.execute("""
        SELECT name FROM projects WHERE id = ?
    """, (project_id,))
    project_row = project_cursor.fetchone()
    if project_row:
        project_name = project_row[0]

# Подготавливаем данные для Calendar App
payload = {
    "title": article_title,
    "content": article_content,
    "images": article_images,
    "source_project": "SMI",
    "arrival_token": arrival_token,
    "project_id": project_id,  # ← ДОБАВИТЬ
    "project_name": project_name  # ← ДОБАВИТЬ
}
```

---

## 🔍 Полный код изменения

**Заменить весь блок подготовки payload на:**

```python
# Получаем информацию о проекте
project_id = None
project_name = "Unknown Project"

if 'project_id' in article.keys() and article['project_id']:
    project_id = article['project_id']
    
    # Получаем название проекта
    project_cursor = conn.cursor()
    project_cursor.execute("SELECT name FROM projects WHERE id = ?", (project_id,))
    project_row = project_cursor.fetchone()
    if project_row:
        project_name = project_row[0]
    project_cursor.close()

# Подготавливаем payload
article_title = article['title'] or article['original_title'] or article['article_original_title'] or "Без названия"
article_content = article['content'] or ""

# Получаем изображения
article_images = []
if article.get('image_url'):
    article_images = [article['image_url']]

# Генерируем уникальный arrival_token
import time
arrival_token = f"smi_{ready_text_id}_{int(time.time())}"

payload = {
    "title": article_title,
    "content": article_content,
    "images": article_images,
    "source_project": "SMI",
    "arrival_token": arrival_token,
    "project_id": project_id,      # ID проекта в SMI
    "project_name": project_name   # Название проекта
}

backend_logger.info(f"📦 Payload for Calendar: project_id={project_id}, project_name={project_name}")
```

---

## 🎯 Как это работает

### Новый flow:

```
1. SMI: Пользователь создаёт проект в SMI
   ↓
2. SMI: Статья привязывается к проекту (project_id)
   ↓
3. SMI: При отправке в календарь передаётся project_id и project_name
   ↓
4. Calendar: Автоматически создаёт/обновляет проект
   ↓
5. Calendar: Пользователь выбирает проект из списка
   ↓
6. Calendar: События показываются с цветом проекта
```

---

## ✅ После внедрения

1. **В SMI:** Проекты управляются через `/api/projects`
2. **В Calendar:** Проекты синхронизируются автоматически
3. **Связь:** `external_project_id` в Calendar = `id` в SMI

---

## 🧪 Тестирование

### 1. Создать проект в SMI
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "project_type_id": 1,
    "name": "Тестовый проект",
    "description": "Описание"
  }'
```

### 2. Создать статью с project_id

### 3. Отправить статью в календарь
```bash
# Должен автоматически создать проект в календаре
curl -X POST http://localhost:8000/api/articles/ready-texts/1/send-to-calendar
```

### 4. Проверить в календаре
```
https://calendar-app-gamma-puce.vercel.app/calendar
```

Должен появиться новый проект с названием из SMI!

---

## 📊 Структура БД Calendar

```sql
projects:
  id                   SERIAL PRIMARY KEY
  user_id             INTEGER
  external_project_id INTEGER  ← ID из SMI
  name                VARCHAR(200)
  description         TEXT
  color               VARCHAR(7)
  synced_at           TIMESTAMP ← время синхронизации
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
```

---

## 🔧 Возможные проблемы

**Проблема:** Проект не появился в календаре

**Решение:**
1. Проверить логи SMI: `backend_logger.info`
2. Проверить логи Calendar: Vercel logs
3. Убедиться что передаются `project_id` и `project_name`

**Проблема:** Дублируются проекты

**Решение:** 
- Проекты синхронизируются по `external_project_id`
- Один проект SMI = один проект Calendar
- При повторной отправке обновляется название

---

## 💡 Преимущества новой архитектуры

✅ Единый источник правды (SMI)
✅ Автоматическая синхронизация
✅ Нет дублирования данных
✅ Простое управление из одного места
✅ Связь через external_project_id

---

**Создано:** 2026-02-16
**Статус:** Ready to implement
