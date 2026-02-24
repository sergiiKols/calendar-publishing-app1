#!/bin/bash
# ========================================
# Calendar App - Deployment Script
# ========================================
# This script deploys the Calendar Publishing App using Docker

set -e  # Exit on error

echo "🚀 Calendar App Deployment Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from .env.docker.example..."
    cp .env.docker.example .env
    echo -e "${YELLOW}📝 Please edit .env file and set your configuration!${NC}"
    echo ""
    echo "Required changes:"
    echo "  1. POSTGRES_PASSWORD - set strong password"
    echo "  2. NEXTAUTH_SECRET - generate with: openssl rand -base64 32"
    echo "  3. CALENDAR_API_KEY - set random API key"
    echo "  4. CRON_SECRET - set random cron secret"
    echo "  5. NEXTAUTH_URL - set your domain (or keep localhost for testing)"
    echo ""
    read -p "Press Enter after you've edited .env file..."
fi

echo "📋 Current configuration:"
echo "------------------------"
source .env
echo "Database: $POSTGRES_DB"
echo "Database User: $POSTGRES_USER"
echo "App URL: $NEXTAUTH_URL"
echo ""

# Ask for deployment mode
echo "Select deployment mode:"
echo "  1) Fresh deployment (will remove existing containers and data)"
echo "  2) Update deployment (keep database data)"
echo "  3) Stop and remove all"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${YELLOW}🔄 Fresh deployment - removing old containers and volumes...${NC}"
        docker-compose down -v
        ;;
    2)
        echo -e "${YELLOW}🔄 Update deployment - keeping database data...${NC}"
        docker-compose down
        ;;
    3)
        echo -e "${RED}🛑 Stopping and removing all containers...${NC}"
        docker-compose down -v
        echo -e "${GREEN}✅ Done!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🏗️  Building Docker images...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${GREEN}🚀 Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}⏳ Waiting for database to be ready...${NC}"
sleep 10

echo ""
echo -e "${GREEN}📊 Container status:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📌 Access points:"
echo "  - Application: http://localhost:3000"
echo "  - Database: localhost:5433"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - View app logs: docker-compose logs -f calendar-app"
echo "  - View db logs: docker-compose logs -f calendar-db"
echo "  - Stop all: docker-compose down"
echo "  - Restart app: docker-compose restart calendar-app"
echo ""
echo "🔐 Next steps:"
echo "  1. Open http://localhost:3000"
echo "  2. Complete initial setup and create admin user"
echo "  3. Configure publishing platforms in the UI"
echo ""
