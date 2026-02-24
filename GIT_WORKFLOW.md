# 🔄 Git Workflow для Calendar App

## Рекомендуемый процесс разработки и деплоя

---

## 🎯 Общая схема работы

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Ваш компьютер  │ ───► │  Git Repo    │ ───► │  Сервер         │
│  (разработка)   │ push │ (GitHub/etc) │ pull │  (production)   │
└─────────────────┘      └──────────────┘      └─────────────────┘
        │                                               │
        │                                               │
        └─────────────── SSH доступ ───────────────────┘
                    (для экстренных случаев)
```

---

## 📝 Пошаговая инструкция

### Шаг 1: Инициализация Git репозитория (если еще не сделано)

```bash
# На вашем компьютере, в папке calendar-app
cd calendar-app

# Инициализировать git (если не инициализирован)
git init

# Добавить все файлы
git add .

# Первый коммит
git commit -m "Initial commit: Calendar App with Docker configuration"

# Создать репозиторий на GitHub/GitLab/Bitbucket
# Затем подключить remote
git remote add origin https://github.com/your-username/calendar-app.git

# Отправить код
git push -u origin main
```

---

### Шаг 2: Первое развертывание на сервере

```bash
# 1. Подключиться к серверу
ssh user@your-server

# 2. Клонировать репозиторий
cd /home/user/
git clone https://github.com/your-username/calendar-app.git
cd calendar-app

# 3. Настроить .env (ОДИН РАЗ)
cp .env.docker.example .env
nano .env
# Измените пароли и секреты

# 4. Запустить
docker-compose up -d

# 5. Проверить
docker-compose ps
curl http://localhost:3000/api/reset-admin
```

**✅ Теперь сервер настроен и работает!**

---

### Шаг 3: Цикл разработки

#### На вашем компьютере:

```bash
# 1. Вносите изменения в код
nano app/page.tsx
nano components/CalendarGrid.tsx

# 2. Тестируете локально (опционально)
npm install
npm run dev
# Открываете http://localhost:3000

# 3. Коммитите изменения
git add .
git commit -m "Add new feature: XYZ"

# 4. Отправляете в Git
git push origin main
```

---

### Шаг 4: Деплой на сервер

#### Автоматический способ (скрипт):

```bash
# На сервере выполните ОДИН РАЗ:
cd /home/user/calendar-app
nano update.sh
```

Содержимое `update.sh`:
```bash
#!/bin/bash
set -e

echo "🔄 Обновление Calendar App..."

# Переход в папку проекта
cd /home/user/calendar-app

# Получить последние изменения
echo "📥 Получение изменений из Git..."
git pull origin main

# Пересобрать и перезапустить Docker
echo "🐳 Перезапуск Docker контейнеров..."
docker-compose down
docker-compose build --no-cache app
docker-compose up -d

# Проверка статуса
echo "✅ Проверка статуса..."
docker-compose ps

echo "🎉 Обновление завершено!"
```

Сделать исполняемым:
```bash
chmod +x update.sh
```

**Теперь для деплоя просто выполняйте:**
```bash
ssh user@your-server
cd /home/user/calendar-app
./update.sh
```

---

#### Ручной способ:

```bash
# На сервере
ssh user@your-server
cd /home/user/calendar-app

# Получить изменения
git pull origin main

# Перезапустить
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Проверить
docker-compose logs -f
```

---

### Шаг 5: Деплой одной командой (с вашего компьютера)

Создайте на компьютере скрипт `deploy-to-server.sh`:

```bash
#!/bin/bash
# Скрипт деплоя с локального компьютера

SERVER="user@your-server-ip"
PROJECT_PATH="/home/user/calendar-app"

echo "🚀 Деплой Calendar App на сервер..."

# 1. Push в Git
echo "📤 Отправка изменений в Git..."
git push origin main

# 2. Обновление на сервере
echo "🔄 Обновление на сервере..."
ssh $SERVER "cd $PROJECT_PATH && git pull origin main && docker-compose down && docker-compose build --no-cache && docker-compose up -d"

# 3. Проверка статуса
echo "✅ Проверка статуса..."
ssh $SERVER "cd $PROJECT_PATH && docker-compose ps"

echo "🎉 Деплой завершен!"
```

**Использование:**
```bash
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

---

## 🔒 Безопасность .env файла

**⚠️ ВАЖНО: .env НЕ должен попадать в Git!**

### Проверьте .gitignore:

```bash
# В calendar-app/.gitignore должно быть:
.env
.env.local
.env*.local
.env.production
```

### На сервере .env создается ОДИН РАЗ вручную:

```bash
# При первом развертывании
cp .env.docker.example .env
nano .env
# Установить реальные пароли

# Этот файл остается на сервере и НЕ удаляется при git pull
```

---

## 📋 Рекомендуемая структура веток

### Для простого проекта:

```
main (production) ──► деплоится на сервер
```

### Для более сложного:

```
main (production) ──► деплоится на production сервер
  ↑
  │ merge
  │
dev (development) ──► деплоится на тестовый сервер (опционально)
  ↑
  │ merge
  │
feature/new-feature ──► разработка новых функций
```

**Workflow:**
```bash
# Создать ветку для новой функции
git checkout -b feature/article-editor

# Разработка...
git add .
git commit -m "Add article editor"

# Отправить в Git
git push origin feature/article-editor

# Merge в main через Pull Request или:
git checkout main
git merge feature/article-editor
git push origin main

# Деплой на сервер
./deploy-to-server.sh
```

---

## 🔧 Управление зависимостями

### Если изменили package.json:

```bash
# На сервере после git pull
docker-compose down
docker-compose build --no-cache  # Пересоберет с новыми зависимостями
docker-compose up -d
```

---

## 🗄️ Управление базой данных

### Миграции схемы БД:

```bash
# Если изменили lib/db/schema.sql

# На сервере
docker-compose exec postgres psql -U calendar_user calendar_db < lib/db/schema.sql

# Или через скрипт миграции
docker-compose exec postgres psql -U calendar_user calendar_db < lib/db/migrate-*.sql
```

### Backup перед деплоем:

```bash
# Создать backup перед обновлением
ssh user@your-server "cd /home/user/calendar-app && docker-compose exec postgres pg_dump -U calendar_user calendar_db > backup_before_update_\$(date +%Y%m%d).sql"
```

---

## 🚀 CI/CD (автоматический деплой)

### GitHub Actions (пример)

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/user/calendar-app
            git pull origin main
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
            docker-compose ps
```

**Настройка GitHub Secrets:**
1. GitHub → Repository → Settings → Secrets
2. Добавить:
   - `SERVER_HOST` - IP вашего сервера
   - `SERVER_USER` - пользователь SSH
   - `SSH_PRIVATE_KEY` - приватный SSH ключ

**Теперь при каждом push в main - автоматический деплой! 🎉**

---

## 📊 Мониторинг деплоев

### Логи деплоя:

```bash
# На сервере
docker-compose logs -f --tail=100

# Только приложение
docker-compose logs -f app

# Сохранить логи
docker-compose logs > deploy_logs_$(date +%Y%m%d).log
```

---

## 🆘 Откат к предыдущей версии

### Быстрый откат:

```bash
# На сервере
cd /home/user/calendar-app

# Посмотреть историю коммитов
git log --oneline -10

# Откатиться на предыдущий коммит
git checkout <commit-hash>

# Перезапустить
docker-compose down
docker-compose up -d

# Вернуться к latest
git checkout main
docker-compose restart
```

---

## ✅ Чеклист деплоя

Перед каждым деплоем:

- [ ] Код протестирован локально
- [ ] Изменения закоммичены в Git
- [ ] Push в удаленный репозиторий выполнен
- [ ] Backup базы данных создан (для важных обновлений)
- [ ] Проверены логи после деплоя
- [ ] Приложение доступно и работает

---

## 💡 Полезные команды

```bash
# Проверить статус Git
git status

# Посмотреть изменения
git diff

# История коммитов
git log --oneline -10

# Создать тег для релиза
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Проверить удаленные репозитории
git remote -v

# Обновить Git на сервере без деплоя
ssh user@server "cd /path/to/calendar-app && git pull origin main"

# Проверить статус Docker на сервере
ssh user@server "cd /path/to/calendar-app && docker-compose ps"
```

---

## 🎯 Рекомендуемый workflow

### Ежедневная разработка:

```bash
# 1. На компьютере - разработка
code .
npm run dev

# 2. Тестирование локально
# Проверяете в браузере

# 3. Коммит
git add .
git commit -m "Fix: calendar bug"
git push origin main

# 4. Деплой на сервер
./deploy-to-server.sh

# 5. Проверка
curl https://your-domain.com
```

---

## 📞 Troubleshooting

### Git pull выдает конфликты:

```bash
# На сервере
git stash  # Сохранить локальные изменения
git pull origin main
git stash pop  # Восстановить изменения
```

### Docker не пересобирается:

```bash
docker-compose build --no-cache --pull
```

### .env случайно попал в Git:

```bash
# Удалить из Git, но сохранить локально
git rm --cached .env
git commit -m "Remove .env from git"
git push origin main

# Добавить в .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
git push origin main
```

---

**🎉 Теперь у вас полноценный Git workflow для разработки и деплоя!**

Вопросы?
- Нужна помощь с настройкой GitHub Actions?
- Хотите настроить автоматический деплой?
- Нужна помощь с SSH ключами?
