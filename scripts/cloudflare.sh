#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.local"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

load_credentials() {
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    source "$ENV_FILE"
    set +a
  fi
  
  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    log_error "CLOUDFLARE_API_TOKEN not set"
    log_info "Run: ./scripts/sync-secrets.sh sync"
    exit 1
  fi
  
  if [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
    log_error "CLOUDFLARE_ZONE_ID not set"
    log_info "Run: ./scripts/sync-secrets.sh sync"
    exit 1
  fi
}

cf_api() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"
  
  local url="https://api.cloudflare.com/client/v4${endpoint}"
  
  local args=(
    -s
    -X "$method"
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
    -H "Content-Type: application/json"
  )
  
  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi
  
  curl "${args[@]}" "$url"
}

cmd_status() {
  load_credentials
  log_info "Checking CloudFlare zone status..."
  
  local response
  response=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}")
  
  if echo "$response" | grep -q '"success":true'; then
    local zone_name status
    zone_name=$(echo "$response" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    log_success "Zone: $zone_name"
    log_success "Status: $status"
    echo ""
    echo -e "${CYAN}Zone ID:${NC} ${CLOUDFLARE_ZONE_ID}"
  else
    log_error "Failed to get zone status"
    echo "$response" | head -5
    exit 1
  fi
}

cmd_dns_list() {
  load_credentials
  log_info "Listing DNS records..."
  
  local response
  response=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/dns_records?per_page=100")
  
  if echo "$response" | grep -q '"success":true'; then
    echo ""
    printf "%-25s %-8s %-50s %-8s\n" "NAME" "TYPE" "CONTENT" "PROXIED"
    printf "%-25s %-8s %-50s %-8s\n" "----" "----" "-------" "-------"
    
    echo "$response" | jq -r '.result[] | [.name, .type, .content, .proxied] | @tsv' | \
      while IFS=$'\t' read -r name type content proxied; do
        printf "%-25s %-8s %-50s %-8s\n" "$name" "$type" "${content:0:50}" "$proxied"
      done
  else
    log_error "Failed to list DNS records"
    echo "$response" | jq '.errors' 2>/dev/null || echo "$response"
    exit 1
  fi
}

cmd_dns_get() {
  local name="${1:-}"
  
  if [[ -z "$name" ]]; then
    log_error "Usage: ./scripts/cloudflare.sh dns get <name>"
    exit 1
  fi
  
  if [[ "$name" != *".villa.cash" ]]; then
    name="${name}.villa.cash"
  fi
  
  load_credentials
  log_info "Getting DNS record: $name"
  
  local response
  response=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=$name")
  
  if echo "$response" | grep -q '"success":true'; then
    local count
    count=$(echo "$response" | jq '.result | length')
    
    if [[ "$count" -eq 0 ]]; then
      log_warn "No record found for $name"
      exit 0
    fi
    
    echo "$response" | jq '.result[0] | {id, name, type, content, proxied, ttl}'
  else
    log_error "Failed to get DNS record"
    exit 1
  fi
}

cmd_dns_upsert() {
  local name="${1:-}"
  local content="${2:-}"
  local type="${3:-CNAME}"
  local proxied="${4:-true}"
  
  if [[ -z "$name" ]] || [[ -z "$content" ]]; then
    log_error "Usage: ./scripts/cloudflare.sh dns upsert <name> <content> [type] [proxied]"
    log_info "Example: ./scripts/cloudflare.sh dns upsert beta villa-staging-production.up.railway.app"
    exit 1
  fi
  
  local full_name
  if [[ "$name" == *".villa.cash" ]]; then
    full_name="$name"
  else
    full_name="${name}.villa.cash"
  fi
  
  load_credentials
  
  local existing
  existing=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=$full_name")
  local record_id
  record_id=$(echo "$existing" | jq -r '.result[0].id // empty')
  
  local data
  data=$(jq -n \
    --arg type "$type" \
    --arg name "$full_name" \
    --arg content "$content" \
    --argjson proxied "$proxied" \
    '{type: $type, name: $name, content: $content, proxied: $proxied, ttl: 1}')
  
  local response
  if [[ -n "$record_id" ]]; then
    log_info "Updating existing record: $full_name"
    response=$(cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/dns_records/$record_id" "$data")
  else
    log_info "Creating new record: $full_name"
    response=$(cf_api POST "/zones/${CLOUDFLARE_ZONE_ID}/dns_records" "$data")
  fi
  
  if echo "$response" | grep -q '"success":true'; then
    log_success "DNS record updated: $full_name → $content"
    echo "$response" | jq '{id: .result.id, name: .result.name, content: .result.content, proxied: .result.proxied}'
  else
    log_error "Failed to upsert DNS record"
    echo "$response" | jq '.errors' 2>/dev/null || echo "$response"
    exit 1
  fi
}

cmd_dns_delete() {
  local name="${1:-}"
  
  if [[ -z "$name" ]]; then
    log_error "Usage: ./scripts/cloudflare.sh dns delete <name>"
    exit 1
  fi
  
  if [[ "$name" != *".villa.cash" ]]; then
    name="${name}.villa.cash"
  fi
  
  load_credentials
  
  local existing
  existing=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=$name")
  local record_id
  record_id=$(echo "$existing" | jq -r '.result[0].id // empty')
  
  if [[ -z "$record_id" ]]; then
    log_warn "Record not found: $name"
    exit 0
  fi
  
  log_warn "Deleting DNS record: $name (ID: $record_id)"
  read -rp "Are you sure? [y/N] " confirm
  
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    log_info "Cancelled"
    exit 0
  fi
  
  local response
  response=$(cf_api DELETE "/zones/${CLOUDFLARE_ZONE_ID}/dns_records/$record_id")
  
  if echo "$response" | grep -q '"success":true'; then
    log_success "Deleted: $name"
  else
    log_error "Failed to delete DNS record"
    exit 1
  fi
}

cmd_cache_purge() {
  load_credentials
  log_info "Purging all cache..."
  
  local response
  response=$(cf_api POST "/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" '{"purge_everything":true}')
  
  if echo "$response" | grep -q '"success":true'; then
    log_success "Cache purged successfully"
  else
    log_error "Failed to purge cache"
    echo "$response" | jq '.errors' 2>/dev/null || echo "$response"
    exit 1
  fi
}

cmd_cache_purge_urls() {
  shift
  local urls=("$@")
  
  if [[ ${#urls[@]} -eq 0 ]]; then
    log_error "Usage: ./scripts/cloudflare.sh cache purge-urls <url1> [url2] ..."
    exit 1
  fi
  
  load_credentials
  log_info "Purging ${#urls[@]} URLs..."
  
  local json_urls
  json_urls=$(printf '%s\n' "${urls[@]}" | jq -R . | jq -s .)
  
  local response
  response=$(cf_api POST "/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" "{\"files\":$json_urls}")
  
  if echo "$response" | grep -q '"success":true'; then
    log_success "URLs purged successfully"
  else
    log_error "Failed to purge URLs"
    exit 1
  fi
}

cmd_cache_dev_mode() {
  local action="${1:-}"
  
  if [[ "$action" != "on" && "$action" != "off" ]]; then
    log_error "Usage: ./scripts/cloudflare.sh cache dev-mode <on|off>"
    exit 1
  fi
  
  load_credentials
  
  local value="off"
  [[ "$action" == "on" ]] && value="on"
  
  log_info "Setting dev mode: $value"
  
  local response
  response=$(cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/development_mode" "{\"value\":\"$value\"}")
  
  if echo "$response" | grep -q '"success":true'; then
    log_success "Dev mode: $value"
    [[ "$action" == "on" ]] && log_warn "Dev mode expires in 3 hours"
  else
    log_error "Failed to set dev mode"
    exit 1
  fi
}

cmd_help() {
  cat <<EOF
CloudFlare DNS and CDN management for Villa

Usage: ./scripts/cloudflare.sh <command> [args...]

Commands:
  status                     Check zone status and credentials
  dns list                   List all DNS records
  dns get <name>             Get specific DNS record
  dns upsert <name> <target> Create or update DNS record
  dns delete <name>          Delete DNS record
  cache purge                Purge all cache
  cache purge-urls <urls>    Purge specific URLs
  cache dev-mode <on|off>    Toggle development mode
  help                       Show this help

Examples:
  ./scripts/cloudflare.sh status
  ./scripts/cloudflare.sh dns list
  ./scripts/cloudflare.sh dns get beta
  ./scripts/cloudflare.sh dns upsert beta villa-staging-production.up.railway.app
  ./scripts/cloudflare.sh cache purge

Setup:
  1. Run ./scripts/sync-secrets.sh sync
  2. Add credentials to .env.local
  3. Run ./scripts/cloudflare.sh status to verify

Security:
  - Credentials loaded from .env.local (gitignored)
  - Never logs tokens
  - Validates before operations
EOF
}

main() {
  local cmd="${1:-help}"
  shift || true
  
  case "$cmd" in
    status) cmd_status "$@" ;;
    dns)
      local subcmd="${1:-list}"
      shift || true
      case "$subcmd" in
        list)   cmd_dns_list "$@" ;;
        get)    cmd_dns_get "$@" ;;
        upsert) cmd_dns_upsert "$@" ;;
        delete) cmd_dns_delete "$@" ;;
        *)      log_error "Unknown dns command: $subcmd"; exit 1 ;;
      esac
      ;;
    cache)
      local subcmd="${1:-purge}"
      shift || true
      case "$subcmd" in
        purge)      cmd_cache_purge "$@" ;;
        purge-urls) cmd_cache_purge_urls "$@" ;;
        dev-mode)   cmd_cache_dev_mode "$@" ;;
        *)          log_error "Unknown cache command: $subcmd"; exit 1 ;;
      esac
      ;;
    help|--help|-h) cmd_help ;;
    *)
      log_error "Unknown command: $cmd"
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"
