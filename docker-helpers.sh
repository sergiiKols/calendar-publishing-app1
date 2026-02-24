#!/bin/bash
# ========================================
# Calendar App - Docker Helper Commands
# ========================================
# Useful commands for managing the Calendar App in Docker

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display menu
show_menu() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Calendar App - Docker Helper Menu${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    echo "1)  Start all services"
    echo "2)  Stop all services"
    echo "3)  Restart all services"
    echo "4)  View all logs"
    echo "5)  View app logs only"
    echo "6)  View database logs only"
    echo "7)  Check container status"
    echo "8)  Backup database"
    echo "9)  Restore database from backup"
    echo "10) Enter app container shell"
    echo "11) Enter database container (psql)"
    echo "12) Rebuild and restart"
    echo "13) Clean up (remove containers and volumes)"
    echo "14) Show resource usage"
    echo "15) Generate new secrets"
    echo "0)  Exit"
    echo ""
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

# Start services
start_services() {
    echo -e "${GREEN}🚀 Starting all services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Services started!${NC}"
    docker-compose ps
}

# Stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped!${NC}"
}

# Restart services
restart_services() {
    echo -e "${YELLOW}🔄 Restarting all services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Services restarted!${NC}"
    docker-compose ps
}

# View all logs
view_all_logs() {
    echo -e "${BLUE}📋 Viewing all logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# View app logs
view_app_logs() {
    echo -e "${BLUE}📋 Viewing app logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f calendar-app
}

# View DB logs
view_db_logs() {
    echo -e "${BLUE}📋 Viewing database logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f calendar-db
}

# Check status
check_status() {
    echo -e "${BLUE}📊 Container Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}🏥 Health Checks:${NC}"
    docker exec calendar-postgres pg_isready -U calendar_user && echo -e "${GREEN}✅ Database is ready${NC}" || echo -e "${RED}❌ Database is not ready${NC}"
}

# Backup database
backup_database() {
    BACKUP_FILE="backup_calendar_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${BLUE}💾 Creating database backup: ${BACKUP_FILE}${NC}"
    docker exec calendar-postgres pg_dump -U calendar_user calendar_db > "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup created: ${BACKUP_FILE}${NC}"
    ls -lh "$BACKUP_FILE"
}

# Restore database
restore_database() {
    echo -e "${YELLOW}Available backups:${NC}"
    ls -1 backup_calendar_*.sql 2>/dev/null || echo "No backups found"
    echo ""
    read -p "Enter backup filename to restore: " backup_file
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup file not found!${NC}"
        return
    fi
    
    echo -e "${YELLOW}⚠️  This will overwrite current database!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo -e "${BLUE}🔄 Restoring database from ${backup_file}...${NC}"
        docker exec -i calendar-postgres psql -U calendar_user calendar_db < "$backup_file"
        echo -e "${GREEN}✅ Database restored!${NC}"
    else
        echo -e "${YELLOW}Restore cancelled${NC}"
    fi
}

# Enter app container
enter_app_container() {
    echo -e "${BLUE}🐚 Entering app container (type 'exit' to leave)...${NC}"
    docker exec -it calendar-nextjs sh
}

# Enter DB container
enter_db_container() {
    echo -e "${BLUE}🐚 Entering database (type '\\q' to exit)...${NC}"
    docker exec -it calendar-postgres psql -U calendar_user -d calendar_db
}

# Rebuild and restart
rebuild_services() {
    echo -e "${YELLOW}🔨 Rebuilding and restarting services...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✅ Services rebuilt and started!${NC}"
    docker-compose ps
}

# Clean up
cleanup() {
    echo -e "${RED}⚠️  WARNING: This will remove all containers and data!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo -e "${RED}🗑️  Cleaning up...${NC}"
        docker-compose down -v
        echo -e "${GREEN}✅ Cleanup complete!${NC}"
    else
        echo -e "${YELLOW}Cleanup cancelled${NC}"
    fi
}

# Show resource usage
show_resources() {
    echo -e "${BLUE}📊 Resource Usage:${NC}"
    docker stats --no-stream
}

# Generate secrets
generate_secrets() {
    echo -e "${BLUE}🔐 Generating new secrets:${NC}"
    echo ""
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
    echo "CALENDAR_API_KEY=$(openssl rand -hex 32)"
    echo "CRON_SECRET=$(openssl rand -hex 32)"
    echo ""
    echo -e "${YELLOW}Copy these to your .env file${NC}"
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice: " choice
    echo ""
    
    case $choice in
        1) start_services ;;
        2) stop_services ;;
        3) restart_services ;;
        4) view_all_logs ;;
        5) view_app_logs ;;
        6) view_db_logs ;;
        7) check_status ;;
        8) backup_database ;;
        9) restore_database ;;
        10) enter_app_container ;;
        11) enter_db_container ;;
        12) rebuild_services ;;
        13) cleanup ;;
        14) show_resources ;;
        15) generate_secrets ;;
        0) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}Invalid option!${NC}" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done
