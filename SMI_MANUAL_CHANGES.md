# 🔧 Ручные изменения в SMI проекте

## Файл: `C:\Users\User\Desktop\smi\api_server.py`

---

## Изменение 1: Обновить SQL запрос (строка ~3430)

### НАЙТИ:
```python
cursor.execute("""
    SELECT rt.*, a.title as article_original_title, a.url as original_url
    FROM ready_texts rt
    LEFT JOIN articles a ON rt.original_article_id = a.id
    WHERE rt.id = ?
""", (ready_text_id,))
```

### ЗАМЕНИТЬ НА:
```python
cursor.execute("""
    SELECT rt.*, a.title as article_original_title, a.url as original_url, 
           rt.project_id, p.name as project_name
    FROM ready_texts rt
    LEFT JOIN articles a ON rt.original_article_id = a.id
    LEFT JOIN projects p ON rt.project_id = p.id
    WHERE rt.id = ?
""", (ready_text_id,))
```

**Что добавили:**
- `rt.project_id` - ID проекта
- `p.name as project_name` - название проекта
- `LEFT JOIN projects p ON rt.project_id = p.id` - джоин с таблицей projects

---

## Изменение 2: Обновить payload (строка ~3469)

### НАЙТИ:
```python
payload = {
    "title": article_title,
    "content": article_content,
    "images": images,
    "source_project": "smi_main",
    "original_id": ready_text_id,
    "platform": article['platform'] or "WordPress",
    "original_url": article['original_url'],
    "arrival_token": arrival_token
}
```

### ЗАМЕНИТЬ НА:
```python
# Получаем информацию о проекте
project_id = article.get('project_id')
project_name = article.get('project_name', 'Unknown Project')

backend_logger.info(f"📦 Article project: ID={project_id}, Name={project_name}")

payload = {
    "title": article_title,
    "content": article_content,
    "images": images,
    "source_project": "smi_main",
    "original_id": ready_text_id,
    "platform": article['platform'] or "WordPress",
    "original_url": article['original_url'],
    "arrival_token": arrival_token,
    "project_id": project_id,        # ← НОВОЕ
    "project_name": project_name      # ← НОВОЕ
}
```

**Что добавили:**
- Получение `project_id` и `project_name` из данных статьи
- Добавление в payload: `project_id` и `project_name`
- Логирование информации о проекте

---

## 🔄 После изменений:

1. **Сохранить файл** `api_server.py`

2. **Перезапустить backend:**
   ```bash
   # Остановить текущий процесс (Ctrl+C)
   # Запустить снова
   python api_server.py
   ```

3. **Протестировать:**
   - Создать/выбрать проект в SMI
   - Создать статью с привязкой к проекту
   - Отправить в календарь
   - Проверить что проект появился в календаре

---

## ✅ Проверка что всё работает:

В логах SMI должно появиться:
```
📦 Article project: ID=1, Name=Мой проект
```

В логах Calendar (Vercel) должно появиться:
```
🔄 Syncing project from SMI: ID=1, Name=Мой проект
✅ Project synced: Мой проект (Calendar ID: 5)
```

---

## 🐛 Troubleshooting:

**Проблема:** `project_id` = None

**Решение:** 
- Убедитесь что статья привязана к проекту в ready_texts
- Проверьте что таблица ready_texts имеет колонку project_id
- Проверьте SQL запрос

**Проблема:** Проект не появляется в календаре

**Решение:**
- Проверьте логи Vercel
- Убедитесь что миграция БД запущена в календаре
- Проверьте что колонка external_project_id существует

---

**Готово!** После этих изменений SMI будет автоматически синхронизировать проекты с календарём.
