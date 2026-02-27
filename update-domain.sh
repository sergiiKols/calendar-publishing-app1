#!/bin/bash
# ========================================
# Скрипт обновления домена для Calendar App
# ========================================
# Использование: ./update-domain.sh
# Новый домен: calendar.energo-audit.online
# ========================================

set -e  # Остановить при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Новый домен
NEW_DOMAIN="calendar.energo-audit.online"
NEW_URL="https://${NEW_DOMAIN}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Обновление домена Calendar App${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Новый домен: ${GREEN}${NEW_DOMAIN}${NC}"
echo -e "Новый URL: ${GREEN}${NEW_URL}${NC}"
echo ""

# ========================================
# Шаг 1: Проверка DNS
# ========================================
echo -e "${BLUE}Шаг 1: Проверка DNS...${NC}"

if command -v nslookup &> /dev/null; then
    echo "Проверяю DNS запись для ${NEW_DOMAIN}..."
    if nslookup ${NEW_DOMAIN} > /dev/null 2>&1; then
        echo -e "${GREEN}✓ DNS запись найдена${NC}"
        DNS_IP=$(nslookup ${NEW_DOMAIN} | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        echo -e "  IP адрес: ${DNS_IP}"
    else
        echo -e "${YELLOW}⚠ DNS запись не найдена или еще не распространилась${NC}"
        echo -e "${YELLOW}  Убедитесь что A-запись для 'calendar' указывает на IP вашего сервера${NC}"
        echo ""
        read -p "Продолжить все равно? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Отменено."
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠ nslookup не найден, пропускаю проверку DNS${NC}"
fi
echo ""

# ========================================
# Шаг 2: Обновление .env файла
# ========================================
echo -e "${BLUE}Шаг 2: Обновление .env файла...${NC}"

if [ ! -f .env ]; then
    echo -e "${RED}✗ Файл .env не найден!${NC}"
    echo "Пожалуйста, убедитесь что вы находитесь в папке проекта"
    exit 1
fi

# Backup .env
echo "Создаю backup .env файла..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup создан${NC}"

# Обновить NEXTAUTH_URL
echo "Обновляю NEXTAUTH_URL..."
if grep -q "^NEXTAUTH_URL=" .env; then
    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=${NEW_URL}|g" .env
    echo -e "${GREEN}✓ NEXTAUTH_URL обновлен${NC}"
else
    echo "NEXTAUTH_URL=${NEW_URL}" >> .env
    echo -e "${GREEN}✓ NEXTAUTH_URL добавлен${NC}"
fi

echo ""
echo "Текущие настройки .env:"
grep "NEXTAUTH_URL=" .env
echo ""

# ========================================
# Шаг 3: Перезапуск Docker контейнеров
# ========================================
echo -e "${BLUE}Шаг 3: Перезапуск Docker контейнеров...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker не найден!${NC}"
    exit 1
fi

echo "Останавливаю контейнеры..."
docker-compose down

echo "Запускаю контейнеры с новой конфигурацией..."
docker-compose up -d

echo "Жду 10 секунд для запуска..."
sleep 10

echo ""
echo -e "${GREEN}✓ Docker контейнеры перезапущены${NC}"
echo ""

# Показать статус
echo "Статус контейнеров:"
docker-compose ps
echo ""

# ========================================
# Шаг 4: Проверка Nginx
# ========================================
echo -e "${BLUE}Шаг 4: Настройка Nginx...${NC}"
echo ""
echo -e "${YELLOW}Следующие команды нужно выполнить вручную с sudo:${NC}"
echo ""
echo "# 1. Создать конфигурацию Nginx:"
echo "sudo nano /etc/nginx/sites-available/calendar"
echo ""
echo "# Скопируйте содержимое файла nginx-calendar.conf"
echo ""
echo "# 2. Активировать конфигурацию:"
echo "sudo ln -s /etc/nginx/sites-available/calendar /etc/nginx/sites-enabled/"
echo ""
echo "# 3. Проверить конфигурацию:"
echo "sudo nginx -t"
echo ""
echo "# 4. Перезагрузить Nginx:"
echo "sudo systemctl reload nginx"
echo ""
echo "# 5. Установить SSL сертификат:"
echo "sudo certbot --nginx -d ${NEW_DOMAIN}"
echo ""

# ========================================
# Завершение
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Обновление домена завершено!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Важно!${NC}"
echo "1. Настройте Nginx как указано выше"
echo "2. Установите SSL сертификат с помощью Certbot"
echo "3. Откройте браузер: ${NEW_URL}"
echo ""
echo -e "${GREEN}Готово!${NC}"
