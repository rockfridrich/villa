#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.local"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] || [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
  log_error "CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID required in .env.local"
  exit 1
fi

cf_api() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"
  
  local args=(
    -s
    -X "$method"
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
    -H "Content-Type: application/json"
  )
  
  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi
  
  curl "${args[@]}" "https://api.cloudflare.com/client/v4${endpoint}"
}

enable_proxy_for_domain() {
  local domain="$1"
  log_info "Enabling CloudFlare proxy for $domain..."
  
  local existing
  existing=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=$domain")
  
  local record_id type content
  record_id=$(echo "$existing" | jq -r '.result[0].id // empty')
  type=$(echo "$existing" | jq -r '.result[0].type // empty')
  content=$(echo "$existing" | jq -r '.result[0].content // empty')
  proxied=$(echo "$existing" | jq -r '.result[0].proxied // false')
  
  if [[ -z "$record_id" ]]; then
    log_error "DNS record not found for $domain"
    return 1
  fi
  
  if [[ "$proxied" == "true" ]]; then
    log_success "$domain already proxied through CloudFlare"
    return 0
  fi
  
  log_info "Current: $domain -> $content (proxied: $proxied)"
  
  local data
  data=$(jq -n \
    --arg type "$type" \
    --arg name "$domain" \
    --arg content "$content" \
    '{type: $type, name: $name, content: $content, proxied: true, ttl: 1}')
  
  local response
  response=$(cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/dns_records/$record_id" "$data")
  
  if echo "$response" | grep -q '"success":true'; then
    log_success "Enabled CloudFlare proxy for $domain"
    echo "$response" | jq '{id: .result.id, name: .result.name, content: .result.content, proxied: .result.proxied}'
  else
    log_error "Failed to enable proxy"
    echo "$response" | jq '.errors' 2>/dev/null || echo "$response"
    return 1
  fi
}

check_cdn_status() {
  local domain="$1"
  log_info "Checking CDN status for $domain..."
  
  local headers
  headers=$(curl -sI "https://$domain" 2>/dev/null | head -20)
  
  if echo "$headers" | grep -qi "server: cloudflare"; then
    log_success "$domain is served through CloudFlare CDN"
    echo "$headers" | grep -iE "server|cf-cache-status|cf-ray" || true
  else
    log_warn "$domain is NOT served through CloudFlare CDN"
    echo "$headers" | grep -iE "server|x-nextjs-cache" || true
  fi
}

main() {
  local cmd="${1:-status}"
  
  case "$cmd" in
    enable)
      log_info "Enabling CloudFlare CDN for Villa domains..."
      echo ""
      enable_proxy_for_domain "docs.villa.cash"
      echo ""
      log_success "CDN enabled. Changes may take a few minutes to propagate."
      log_info "Run '$0 status' to verify."
      ;;
    disable)
      log_error "Use ./scripts/cloudflare.sh dns upsert to disable proxy manually"
      ;;
    status)
      log_info "Checking CDN status for Villa domains..."
      echo ""
      check_cdn_status "villa.cash"
      echo ""
      check_cdn_status "docs.villa.cash"
      echo ""
      check_cdn_status "construction.villa.cash"
      ;;
    *)
      cat <<EOF
Enable CloudFlare CDN proxy for Villa domains

Usage: $0 <command>

Commands:
  enable    Enable CloudFlare proxy for docs.villa.cash
  status    Check current CDN status for all domains

This script enables CloudFlare CDN caching in front of Railway.
Benefits:
  - Global edge caching (300+ cities)
  - Reduced latency (<50ms for most users)
  - DDoS protection
  - Automatic SSL

After enabling, verify with:
  curl -sI https://docs.villa.cash | grep -i "server\|cf-"
  # Should show "server: cloudflare" and "cf-cache-status: HIT/MISS"
EOF
      ;;
  esac
}

main "$@"
