# 🚀 Деплой на calendar.energo-audit.online

## Что нужно сделать

Ваш проект уже запущен в Docker на сервере. Чтобы он работал на домене **calendar.energo-audit.online**, нужно выполнить следующие шаги:

---

## Шаг 1: Обновить переменные окружения в Docker

### 1.1 Подключитесь к серверу по SSH
```bash
ssh user@your-server-ip
```

### 1.2 Перейдите в папку проекта
```bash
cd /path/to/your/calendar-app
```

### 1.3 Откройте файл .env для редактирования
```bash
nano .env
```

### 1.4 Найдите и измените строку NEXTAUTH_URL
**Было:**
```env
NEXTAUTH_URL=http://localhost:3000
# или
NEXTAUTH_URL=http://your-server-ip:3000
```

**Должно быть:**
```env
NEXTAUTH_URL=https://calendar.energo-audit.online
```

### 1.5 Сохраните файл
- Нажмите `Ctrl+O` (сохранить)
- Нажмите `Enter` (подтвердить)
- Нажмите `Ctrl+X` (выйти)

---

## Шаг 2: Настроить Nginx (обратный прокси)

### 2.1 Установите Nginx (если еще не установлен)
```bash
sudo apt update
sudo apt install nginx -y
```

### 2.2 Создайте конфигурационный файл для вашего сайта
```bash
sudo nano /etc/nginx/sites-available/calendar
```

### 2.3 Вставьте следующую конфигурацию:
```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name calendar.energo-audit.online;
    
    # Logs
    access_log /var/log/nginx/calendar-access.log;
    error_log /var/log/nginx/calendar-error.log;
    
    # Maximum upload size
    client_max_body_size 50M;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2.4 Сохраните файл (Ctrl+O, Enter, Ctrl+X)

### 2.5 Создайте символическую ссылку для активации сайта
```bash
sudo ln -s /etc/nginx/sites-available/calendar /etc/nginx/sites-enabled/
```

### 2.6 Проверьте конфигурацию Nginx
```bash
sudo nginx -t
```

Должно быть:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 2.7 Перезагрузите Nginx
```bash
sudo systemctl reload nginx
```

---

## Шаг 3: Настроить SSL сертификат (HTTPS)

### 3.1 Установите Certbot для Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 3.2 Получите SSL сертификат
```bash
sudo certbot --nginx -d calendar.energo-audit.online
```

**Ответьте на вопросы:**
1. Email для уведомлений: введите ваш email
2. Согласие с условиями: `Y` (yes)
3. Подписка на новости: `N` (no, необязательно)
4. Redirect HTTP → HTTPS: `2` (да, рекомендуется)

Certbot автоматически:
- Получит SSL сертификат
- Обновит Nginx конфигурацию для HTTPS
- Настроит автоматическое обновление сертификата

---

## Шаг 4: Перезапустить Docker контейнеры

### 4.1 Перейдите в папку проекта
```bash
cd /path/to/your/calendar-app
```

### 4.2 Перезапустите контейнеры
```bash
docker-compose down
docker-compose up -d
```

### 4.3 Проверьте статус контейнеров
```bash
docker-compose ps
```

Все контейнеры должны быть в статусе `Up`

### 4.4 Проверьте логи (если нужно)
```bash
docker-compose logs -f calendar-app
```

---

## Шаг 5: Проверка работы

### 5.1 Откройте браузер и перейдите на:
```
https://calendar.energo-audit.online
```

### 5.2 Проверьте что:
- ✅ Сайт открывается по HTTPS (зеленый замочек)
- ✅ Нет ошибок сертификата
- ✅ Вы можете войти в систему
- ✅ Все функции работают

---

## Шаг 6: Обновить URL в SMI проекте (если интегрирован)

Если ваш SMI проект отправляет статьи в Calendar App, обновите URL:

**Было:**
```python
"http://your-server-ip:3000/api/articles/receive"
```

**Должно быть:**
```python
"https://calendar.energo-audit.online/api/articles/receive"
```

---

## ⚠️ Важно: DNS настройки

**Убедитесь что DNS настроен правильно!**

Проверьте что домен `calendar.energo-audit.online` указывает на IP адрес вашего сервера:

### Проверка DNS:
```bash
nslookup calendar.energo-audit.online
```

Должен вернуть IP адрес вашего сервера.

### Если DNS еще не настроен:
1. Зайдите в панель управления вашего DNS провайдера (где зарегистрирован energo-audit.online)
2. Создайте A-запись:
   - **Имя:** `calendar`
   - **Тип:** `A`
   - **Значение:** `IP_адрес_вашего_сервера`
   - **TTL:** `3600` (или Auto)

Подождите 5-15 минут для распространения DNS.

---

## Быстрая команда (все в одном)

Если вы уверены в настройках, можете выполнить все сразу:

```bash
# 1. Обновить .env
cd /path/to/your/calendar-app
sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://calendar.energo-audit.online|g' .env

# 2. Перезапустить Docker
docker-compose down
docker-compose up -d

# 3. Проверить статус
docker-compose ps
```

Затем настройте Nginx и SSL как описано выше (Шаги 2-3).

---

## Устранение проблем

### Проблема: "502 Bad Gateway"
**Решение:** Docker контейнер не запущен
```bash
docker-compose ps  # Проверить статус
docker-compose logs calendar-app  # Посмотреть логи
docker-compose up -d  # Запустить заново
```

### Проблема: "This site can't be reached"
**Решение:** DNS еще не обновился или Nginx не запущен
```bash
# Проверить DNS
nslookup calendar.energo-audit.online

# Проверить Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Проблема: "Your connection is not private" (SSL ошибка)
**Решение:** SSL сертификат не установлен
```bash
sudo certbot --nginx -d calendar.energo-audit.online
```

### Проблема: NextAuth ошибка (redirect loop)
**Решение:** NEXTAUTH_URL неправильно настроен
```bash
# Проверьте .env
cat .env | grep NEXTAUTH_URL

# Должно быть: NEXTAUTH_URL=https://calendar.energo-audit.online
```

---

## Полезные команды

```bash
# Посмотреть логи приложения
docker-compose logs -f calendar-app

# Посмотреть логи Nginx
sudo tail -f /var/log/nginx/calendar-error.log

# Перезапустить Nginx
sudo systemctl restart nginx

# Перезапустить Docker контейнеры
docker-compose restart

# Проверить что порт 3000 слушается
sudo netstat -tulpn | grep 3000

# Проверить SSL сертификат
sudo certbot certificates
```

---

## Что дальше?

После успешного деплоя:

1. ✅ Войдите в систему: https://calendar.energo-audit.online
2. ✅ Создайте административный аккаунт (если еще не создан)
3. ✅ Настройте платформы публикации (WordPress, Telegram, и т.д.)
4. ✅ Интегрируйте с SMI проектом
5. ✅ Протестируйте публикацию статей

---

**Если возникли проблемы - дайте знать, помогу разобраться!** 🚀
