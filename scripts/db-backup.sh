#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: $0 [backup|restore|list] [options]"
    echo ""
    echo "Commands:"
    echo "  backup              Create a new backup"
    echo "  restore <file>      Restore from backup file"
    echo "  list                List available backups"
    echo ""
    echo "Options:"
    echo "  --env <env>         Environment: production, staging (default: staging)"
    echo "  --output <dir>      Output directory (default: ./backups)"
    echo ""
    echo "Examples:"
    echo "  $0 backup --env production"
    echo "  $0 restore backups/villa-production-2026-01-22.sql.gz"
    echo "  $0 list"
    exit 1
}

check_prerequisites() {
    if ! command -v doctl &> /dev/null; then
        echo -e "${RED}Error: doctl is not installed${NC}"
        echo "Install with: brew install doctl"
        exit 1
    fi

    if ! doctl auth list &> /dev/null; then
        echo -e "${RED}Error: doctl is not authenticated${NC}"
        echo "Run: doctl auth init"
        exit 1
    fi

    if ! command -v pg_dump &> /dev/null; then
        echo -e "${RED}Error: pg_dump is not installed${NC}"
        echo "Install with: brew install postgresql@17"
        exit 1
    fi
}

get_db_connection() {
    local env="$1"
    local db_name="villa-db"
    
    if [[ "$env" == "staging" ]]; then
        db_name="villa-db"
    elif [[ "$env" == "production" ]]; then
        db_name="villa-db-production"
    fi
    
    local db_id=$(doctl databases list --format ID,Name --no-header 2>/dev/null | grep "$db_name" | awk '{print $1}' || true)
    
    if [[ -z "$db_id" ]]; then
        echo -e "${RED}Error: Database '$db_name' not found${NC}"
        echo "Available databases:"
        doctl databases list --format Name
        exit 1
    fi
    
    echo "$db_id"
}

do_backup() {
    local env="${1:-staging}"
    
    echo -e "${BLUE}Villa Database Backup${NC}"
    echo "====================="
    echo -e "Environment: ${YELLOW}$env${NC}"
    echo ""
    
    check_prerequisites
    
    mkdir -p "$BACKUP_DIR"
    
    local db_id=$(get_db_connection "$env")
    local timestamp=$(date +%Y-%m-%d-%H%M%S)
    local backup_file="$BACKUP_DIR/villa-$env-$timestamp.sql.gz"
    
    echo -e "${YELLOW}Fetching connection details...${NC}"
    local conn_info=$(doctl databases connection "$db_id" --format Host,Port,User,Password,Database --no-header)
    
    local host=$(echo "$conn_info" | awk '{print $1}')
    local port=$(echo "$conn_info" | awk '{print $2}')
    local user=$(echo "$conn_info" | awk '{print $3}')
    local password=$(echo "$conn_info" | awk '{print $4}')
    local database=$(echo "$conn_info" | awk '{print $5}')
    
    echo -e "${YELLOW}Creating backup...${NC}"
    echo "  Host: $host"
    echo "  Database: $database"
    echo "  Output: $backup_file"
    echo ""
    
    PGPASSWORD="$password" pg_dump \
        -h "$host" \
        -p "$port" \
        -U "$user" \
        -d "$database" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        2>/dev/null | gzip > "$backup_file"
    
    local size=$(du -h "$backup_file" | cut -f1)
    
    echo -e "${GREEN}Backup complete!${NC}"
    echo "  File: $backup_file"
    echo "  Size: $size"
    echo ""
    echo -e "${YELLOW}To restore:${NC}"
    echo "  $0 restore $backup_file --env $env"
}

do_restore() {
    local backup_file="$1"
    local env="${2:-staging}"
    
    if [[ ! -f "$backup_file" ]]; then
        echo -e "${RED}Error: Backup file not found: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${RED}WARNING: This will OVERWRITE the $env database!${NC}"
    echo -e "Backup file: ${YELLOW}$backup_file${NC}"
    echo ""
    read -p "Type 'yes' to confirm: " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        echo "Aborted."
        exit 1
    fi
    
    check_prerequisites
    
    local db_id=$(get_db_connection "$env")
    
    echo -e "${YELLOW}Fetching connection details...${NC}"
    local conn_info=$(doctl databases connection "$db_id" --format Host,Port,User,Password,Database --no-header)
    
    local host=$(echo "$conn_info" | awk '{print $1}')
    local port=$(echo "$conn_info" | awk '{print $2}')
    local user=$(echo "$conn_info" | awk '{print $3}')
    local password=$(echo "$conn_info" | awk '{print $4}')
    local database=$(echo "$conn_info" | awk '{print $5}')
    
    echo -e "${YELLOW}Restoring backup...${NC}"
    
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | PGPASSWORD="$password" psql \
            -h "$host" \
            -p "$port" \
            -U "$user" \
            -d "$database" \
            --quiet \
            2>/dev/null
    else
        PGPASSWORD="$password" psql \
            -h "$host" \
            -p "$port" \
            -U "$user" \
            -d "$database" \
            --quiet \
            -f "$backup_file" \
            2>/dev/null
    fi
    
    echo -e "${GREEN}Restore complete!${NC}"
}

do_list() {
    echo -e "${BLUE}Available Backups${NC}"
    echo "================="
    echo ""
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        echo "No backups found (directory doesn't exist)"
        exit 0
    fi
    
    local count=$(ls -1 "$BACKUP_DIR"/*.sql* 2>/dev/null | wc -l || echo 0)
    
    if [[ "$count" -eq 0 ]]; then
        echo "No backups found"
        exit 0
    fi
    
    echo "Directory: $BACKUP_DIR"
    echo ""
    
    ls -lh "$BACKUP_DIR"/*.sql* 2>/dev/null | awk '{print $9, $5, $6, $7, $8}'
}

ENV="staging"
OUTPUT=""
COMMAND=""
RESTORE_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        backup|restore|list)
            COMMAND="$1"
            shift
            if [[ "$COMMAND" == "restore" && $# -gt 0 && ! "$1" =~ ^-- ]]; then
                RESTORE_FILE="$1"
                shift
            fi
            ;;
        --env)
            ENV="$2"
            shift 2
            ;;
        --output)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            if [[ -z "$COMMAND" ]]; then
                echo -e "${RED}Unknown command: $1${NC}"
                usage
            fi
            shift
            ;;
    esac
done

if [[ -z "$COMMAND" ]]; then
    usage
fi

case $COMMAND in
    backup)
        do_backup "$ENV"
        ;;
    restore)
        if [[ -z "$RESTORE_FILE" ]]; then
            echo -e "${RED}Error: restore requires a backup file${NC}"
            usage
        fi
        do_restore "$RESTORE_FILE" "$ENV"
        ;;
    list)
        do_list
        ;;
esac
