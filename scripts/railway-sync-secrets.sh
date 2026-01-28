#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="7c344004-cd63-4b10-8479-9991c3923115"
ENVIRONMENT="production"

SERVICES=(
    "villa-staging:afc99a53-eb94-45ff-b018-8fc29b8cc84a"
    "villa-developers:3ebdb598-a8c3-4523-8783-b8adc294fc08"
    "villa-key-staging:KEY_SERVICE_ID"
)

usage() {
    echo "Usage: $0 <command> [service]"
    echo ""
    echo "Commands:"
    echo "  list [service]     List variables for service (or all)"
    echo "  sync <service>     Sync secrets from .env.local to Railway service"
    echo "  set <service> <key> <value>  Set a single variable"
    echo "  status             Show all services status"
    echo ""
    echo "Services: villa-staging, villa-developers, villa-key-staging"
    echo ""
    echo "Examples:"
    echo "  $0 list villa-staging"
    echo "  $0 sync villa-staging"
    echo "  $0 set villa-staging DATABASE_URL 'postgres://...'"
    exit 1
}

check_railway() {
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}Error: Railway CLI not installed${NC}"
        echo "Install with: brew install railway"
        exit 1
    fi
    
    if ! railway whoami &> /dev/null; then
        echo -e "${RED}Error: Railway CLI not authenticated${NC}"
        echo "Run: railway login"
        exit 1
    fi
}

get_service_id() {
    local service_name="$1"
    for entry in "${SERVICES[@]}"; do
        local name="${entry%%:*}"
        local id="${entry##*:}"
        if [[ "$name" == "$service_name" ]]; then
            echo "$id"
            return 0
        fi
    done
    echo ""
}

link_service() {
    local service_name="$1"
    cd "$PROJECT_ROOT"
    railway link --project "$PROJECT_ID" --environment "$ENVIRONMENT" --service "$service_name" 2>/dev/null || true
}

cmd_list() {
    local service="${1:-}"
    
    check_railway
    cd "$PROJECT_ROOT"
    
    if [[ -z "$service" ]]; then
        echo -e "${BLUE}Listing all Railway services...${NC}"
        railway status --json 2>/dev/null | jq -r '.environments.edges[].node.serviceInstances.edges[].node | "\(.serviceName): \(.id)"' 2>/dev/null || railway status
    else
        echo -e "${BLUE}Variables for $service:${NC}"
        link_service "$service"
        railway variables 2>&1
    fi
}

cmd_sync() {
    local service="${1:-}"
    
    if [[ -z "$service" ]]; then
        echo -e "${RED}Error: service name required${NC}"
        usage
    fi
    
    check_railway
    
    local env_file="$PROJECT_ROOT/.env.local"
    if [[ ! -f "$env_file" ]]; then
        echo -e "${RED}Error: .env.local not found${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Syncing secrets to $service...${NC}"
    
    link_service "$service"
    
    local secrets_to_sync=(
        "DATABASE_URL"
        "MINTER_PRIVATE_KEY"
    )
    
    local public_vars_staging=(
        "NODE_ENV=production"
        "NEXT_TELEMETRY_DISABLED=1"
        "NEXT_PUBLIC_ENV=staging"
        "NEXT_PUBLIC_DOMAIN=construction.villa.cash"
        "NEXT_PUBLIC_APP_URL=https://construction.villa.cash"
        "NEXT_PUBLIC_PORTO_ENV=stg"
        "NEXT_PUBLIC_PORTO_DIALOG_HOST=https://id.porto.sh"
        "NEXT_PUBLIC_CHAIN_ID=84532"

        "NICKNAME_RESOLVER_V3_ADDRESS=0x180ddE044F1627156Cac6b2d068706508902AE9C"
    )
    
    local public_vars_developers=(
        "NODE_ENV=production"
        "PORT=3000"
        "HOSTNAME=0.0.0.0"
        "NEXT_TELEMETRY_DISABLED=1"
    )
    
    local public_vars_key=(
        "NODE_ENV=production"
        "NEXT_TELEMETRY_DISABLED=1"
        "NEXT_PUBLIC_ENV=staging"
        "NEXT_PUBLIC_DOMAIN=fake-key.villa.cash"
        "NEXT_PUBLIC_APP_URL=https://fake-key.villa.cash"
    )
    
    source "$env_file" 2>/dev/null || true
    
    for secret in "${secrets_to_sync[@]}"; do
        local value="${!secret:-}"
        if [[ -n "$value" ]]; then
            echo -e "  Setting ${YELLOW}$secret${NC}..."
            railway variable set "$secret=$value" 2>/dev/null && echo -e "  ${GREEN}✓${NC} $secret" || echo -e "  ${RED}✗${NC} $secret"
        else
            echo -e "  ${YELLOW}Skipping $secret (not in .env.local)${NC}"
        fi
    done
    
    local public_vars=()
    case "$service" in
        villa-staging)
            public_vars=("${public_vars_staging[@]}")
            ;;
        villa-developers)
            public_vars=("${public_vars_developers[@]}")
            ;;
        villa-key-staging)
            public_vars=("${public_vars_key[@]}")
            ;;
    esac
    
    for var in "${public_vars[@]}"; do
        echo -e "  Setting ${YELLOW}${var%%=*}${NC}..."
        railway variable set "$var" 2>/dev/null && echo -e "  ${GREEN}✓${NC} ${var%%=*}" || echo -e "  ${RED}✗${NC} ${var%%=*}"
    done
    
    echo ""
    echo -e "${GREEN}Sync complete!${NC}"
    echo -e "Run ${YELLOW}railway redeploy${NC} to apply changes."
}

cmd_set() {
    local service="${1:-}"
    local key="${2:-}"
    local value="${3:-}"
    
    if [[ -z "$service" || -z "$key" ]]; then
        echo -e "${RED}Error: service, key required${NC}"
        usage
    fi
    
    check_railway
    link_service "$service"
    
    if [[ -z "$value" ]]; then
        echo -e "Enter value for $key (hidden):"
        read -rs value
        echo
    fi
    
    echo -e "Setting ${YELLOW}$key${NC} on $service..."
    railway variable set "$key=$value" 2>/dev/null && echo -e "${GREEN}✓${NC} Set $key" || echo -e "${RED}✗${NC} Failed"
}

cmd_status() {
    check_railway
    cd "$PROJECT_ROOT"
    
    echo -e "${BLUE}Railway Project Status${NC}"
    echo "======================"
    echo ""
    
    railway status 2>&1
    
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo "  villa-staging:     https://construction.villa.cash"
    echo "  villa-developers:  https://docs.villa.cash (pending DNS)"
    echo "  villa-key-staging: https://fake-key.villa.cash"
}

cmd_redeploy() {
    local service="${1:-}"
    
    if [[ -z "$service" ]]; then
        echo -e "${RED}Error: service name required${NC}"
        usage
    fi
    
    check_railway
    link_service "$service"
    
    echo -e "${BLUE}Redeploying $service...${NC}"
    railway redeploy 2>&1
    echo -e "${GREEN}Redeploy triggered!${NC}"
}

main() {
    local cmd="${1:-help}"
    shift || true
    
    case "$cmd" in
        list)     cmd_list "$@" ;;
        sync)     cmd_sync "$@" ;;
        set)      cmd_set "$@" ;;
        status)   cmd_status "$@" ;;
        redeploy) cmd_redeploy "$@" ;;
        help|--help|-h) usage ;;
        *)
            echo -e "${RED}Unknown command: $cmd${NC}"
            usage
            ;;
    esac
}

main "$@"
