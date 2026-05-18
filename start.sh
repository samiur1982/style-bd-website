#!/bin/bash

# ╔════════════════════════════════════════════════════════════════╗
# ║              Style-BD — Premium Startup System                 ║
# ║      Automated Environment Sync, Build, and Server Launch      ║
# ╚════════════════════════════════════════════════════════════════╝

# Terminal Colors
GOLD='\033[0;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CORE_DIR="$ROOT_DIR/core"
ADMIN_DIR="$ROOT_DIR/admin"

clear
echo -e "${GOLD}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║                STYLE-BD LUXURY STOREFRONT                ║"
echo "  ║                     System Startup                       ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check for dependencies
check_deps() {
    echo -e "${CYAN}▶ Checking Environment Dependencies...${NC}"
    
    if [ ! -d "$CORE_DIR/node_modules" ]; then
        echo -e "${RED}✗ core/node_modules missing. Running npm install...${NC}"
        cd "$CORE_DIR" && npm install
    fi

    if [ ! -d "$CORE_DIR/vendor" ]; then
        echo -e "${RED}✗ core/vendor missing. Running composer install...${NC}"
        cd "$CORE_DIR" && composer install
    fi
}

# 1. Build frontend assets (CSS + JS)
build_assets() {
    echo -e "${CYAN}▶ Step 1/4 — Synchronizing Frontend Assets (Vite Build)...${NC}"
    cd "$CORE_DIR"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Build failed! Please check your terminal for errors.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Frontend assets synchronized.${NC}"
    echo ""
}

# 2. Clear Laravel caches
clear_caches() {
    echo -e "${CYAN}▶ Step 2/4 — Purging System Caches...${NC}"
    cd "$CORE_DIR"
    php artisan view:clear > /dev/null
    php artisan config:clear > /dev/null
    php artisan route:clear > /dev/null
    php artisan cache:clear > /dev/null
    echo -e "${GREEN}✓ All caches purged.${NC}"
    echo ""
}

# 3. Run migrations
run_migrations() {
    echo -e "${CYAN}▶ Step 3/4 — Validating Database Schema...${NC}"
    cd "$CORE_DIR"
    php artisan migrate --force
    echo -e "${GREEN}✓ Database is up to date.${NC}"
    echo ""
}

# 4. Start Servers
start_servers() {
    echo -e "${GOLD}${BOLD}▶ Step 4/4 — Launching Development Servers${NC}"
    echo ""
    echo -e "  ${BOLD}Storefront:${NC} ${CYAN}http://localhost:8000${NC}"
    echo -e "  ${BOLD}Admin Panel:${NC} ${CYAN}http://localhost:3000${NC}"
    echo ""
    echo -e "${GOLD}Note:${NC} The Admin panel requires a separate process. ${BOLD}Running both now...${NC}"
    echo ""
    echo -e "${CYAN}Press Ctrl+C to stop both servers.${NC}"
    echo ""

    # Check if admin node_modules exist
    if [ ! -d "$ADMIN_DIR/node_modules" ]; then
        echo -e "${RED}Notice: Admin node_modules missing. Installing...${NC}"
        cd "$ADMIN_DIR" && npm install
    fi

    # Run both in parallel using a simple background process trap
    trap 'kill %1; kill %2; exit' SIGINT
    
    cd "$CORE_DIR" && php artisan serve --quiet &
    cd "$ADMIN_DIR" && npm run dev &
    
    wait
}

# Execute Workflow
check_deps
build_assets
clear_caches
run_migrations
start_servers
