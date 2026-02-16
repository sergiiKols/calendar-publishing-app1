"""
Скрипт для обновления SMI endpoint для передачи project_id в календарь
Запустить из: C:\Users\User\Desktop\smi
"""

import re

# Путь к файлу
file_path = "api_server.py"

# Читаем файл
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Обновляем SQL запрос для получения project_id
old_query = """cursor.execute(\"\"\"
            SELECT rt.*, a.title as article_original_title, a.url as original_url
            FROM ready_texts rt
            LEFT JOIN articles a ON rt.original_article_id = a.id
            WHERE rt.id = ?
        \"\"\", (ready_text_id,))"""

new_query = """cursor.execute(\"\"\"
            SELECT rt.*, a.title as article_original_title, a.url as original_url, 
                   rt.project_id, p.name as project_name
            FROM ready_texts rt
            LEFT JOIN articles a ON rt.original_article_id = a.id
            LEFT JOIN projects p ON rt.project_id = p.id
            WHERE rt.id = ?
        \"\"\", (ready_text_id,))"""

if old_query in content:
    content = content.replace(old_query, new_query)
    print("✓ SQL query updated to include project_id")
else:
    print("⚠ Old query not found - checking alternative format...")
    # Пробуем другой формат
    old_query_alt = 'cursor.execute("""\n            SELECT rt.*, a.title as article_original_title, a.url as original_url\n            FROM ready_texts rt\n            LEFT JOIN articles a ON rt.original_article_id = a.id\n            WHERE rt.id = ?\n        """, (ready_text_id,))'
    new_query_alt = 'cursor.execute("""\n            SELECT rt.*, a.title as article_original_title, a.url as original_url, \n                   rt.project_id, p.name as project_name\n            FROM ready_texts rt\n            LEFT JOIN articles a ON rt.original_article_id = a.id\n            LEFT JOIN projects p ON rt.project_id = p.id\n            WHERE rt.id = ?\n        """, (ready_text_id,))'
    
    if old_query_alt in content:
        content = content.replace(old_query_alt, new_query_alt)
        print("✓ SQL query updated (alternative format)")

# 2. Обновляем payload - добавляем project_id и project_name
old_payload = '''payload = {
            "title": article_title,
            "content": article_content,
            "images": images,
            "source_project": "smi_main",
            "original_id": ready_text_id,
            "platform": article['platform'] or "WordPress",
            "original_url": article['original_url'],
            "arrival_token": arrival_token  # Добавляем токен для отслеживания
        }'''

new_payload = '''# Получаем project_id и project_name из article
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
            "arrival_token": arrival_token,  # Добавляем токен для отслеживания
            "project_id": project_id,  # ID проекта в SMI
            "project_name": project_name  # Название проекта
        }'''

if old_payload in content:
    content = content.replace(old_payload, new_payload)
    print("✓ Payload updated to include project_id and project_name")
else:
    print("⚠ Old payload not found")

# Сохраняем изменения
with open(file_path + '.updated', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n" + "="*60)
print("✅ File updated successfully!")
print("="*60)
print(f"\nNew file created: {file_path}.updated")
print("\nNext steps:")
print("1. Review the changes in api_server.py.updated")
print("2. If everything looks good:")
print("   - Backup: copy api_server.py api_server.py.backup")
print("   - Apply: copy api_server.py.updated api_server.py")
print("3. Restart backend: python api_server.py")
print("\n" + "="*60)
