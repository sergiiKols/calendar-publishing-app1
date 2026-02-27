# 🔧 Настройка переменных окружения в Dokploy

## ⚠️ ВАЖНО: Добавьте эти переменные в раздел Environment

Перейдите в **Dokploy → Ваше приложение → Environment** и добавьте ВСЕ следующие переменные:

### 📊 Основные настройки
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 🗄️ База данных
```
POSTGRES_USER=calendar_user
POSTGRES_PASSWORD=CalendarPass2026Secure
POSTGRES_DB=calendar_db
POSTGRES_HOST=calendarpublishingapp1-calendardb-0rolji

DATABASE_URL=postgresql://calendar_user:CalendarPass2026Secure@calendarpublishingapp1-calendardb-0rolji:5432/calendar_db
POSTGRES_URL=postgresql://calendar_user:CalendarPass2026Secure@calendarpublishingapp1-calendardb-0rolji:5432/calendar_db
POSTGRES_PRISMA_URL=postgresql://calendar_user:CalendarPass2026Secure@calendarpublishingapp1-calendardb-0rolji:5432/calendar_db?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://calendar_user:CalendarPass2026Secure@calendarpublishingapp1-calendardb-0rolji:5432/calendar_db
```

### 🔐 Аутентификация (NextAuth)
```
NEXTAUTH_URL=https://calendar.energo-audit.online
NEXTAUTH_SECRET=aB3xK9mP2qR5sT7uV1wX4yZ6cD8eF0gH1iJ3kL5mN7oP9qR
```

### 🔑 API ключи и шифрование
```
CALENDAR_API_KEY=1267778366
SMI_API_TOKEN=1267778366
ENCRYPTION_KEY=Ql&1.Z}CWpv>yX+3PfC=$\p*tp8be6~&
CRON_SECRET=1267778366
```

### 👤 Администратор
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass123!
```

---

## 🚀 После добавления переменных:

1. **Сохраните изменения** в разделе Environment
2. **Перезапустите приложение**: Перейдите в Deployments → Redeploy
3. **Проверьте логи**: Убедитесь, что нет ошибок подключения к БД
4. **Откройте сайт**: https://calendar.energo-audit.online

---

## 🔍 Проверка подключения к базе данных

После перезапуска проверьте логи приложения. Должно быть сообщение о успешном подключении к PostgreSQL.

Если видите ошибку `ENOTFOUND` или `connection refused`, убедитесь что:
- Контейнер БД запущен
- Имя хоста БД правильное (проверьте в разделе Postgres вашего проекта)

---

## 🎯 Вход в систему

После успешного запуска:
1. Откройте https://calendar.energo-audit.online
2. Войдите с учетными данными:
   - **Email:** admin@example.com
   - **Password:** AdminPass123!

---

## ⚠️ Безопасность

После первого входа **обязательно**:
1. Измените пароль администратора
2. Смените NEXTAUTH_SECRET на случайную строку (32+ символов)
3. Обновите ENCRYPTION_KEY на уникальное значение

Генератор случайных ключей:
```bash
openssl rand -base64 32
```
