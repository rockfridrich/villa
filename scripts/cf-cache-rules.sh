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

list_cache_rules() {
  log_info "Listing cache rules for zone..."
  
  local response
  response=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/rulesets?phase=http_request_cache_settings")
  
  if echo "$response" | grep -q '"success":true'; then
    local ruleset_id
    ruleset_id=$(echo "$response" | jq -r '.result[0].id // empty')
    
    if [[ -z "$ruleset_id" ]]; then
      log_warn "No cache rules ruleset found"
      return 0
    fi
    
    local ruleset
    ruleset=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/rulesets/$ruleset_id")
    echo "$ruleset" | jq '.result.rules[] | {description, expression, action_parameters}'
  else
    log_error "Failed to list cache rules"
    echo "$response" | jq '.errors' 2>/dev/null || echo "$response"
  fi
}

create_villa_cache_rules() {
  log_info "Creating cache rules for villa.cash domains..."
  
  local existing
  existing=$(cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/rulesets?phase=http_request_cache_settings")
  local ruleset_id
  ruleset_id=$(echo "$existing" | jq -r '.result[0].id // empty')
  
  local rules='[
    {
      "description": "Cache static assets for 1 year",
      "expression": "(http.host eq \"docs.villa.cash\" and starts_with(http.request.uri.path, \"/_next/static\"))",
      "action": "set_cache_settings",
      "action_parameters": {
        "cache": true,
        "edge_ttl": {
          "mode": "override_origin",
          "default": 31536000
        },
        "browser_ttl": {
          "mode": "override_origin",
          "default": 31536000
        }
      }
    },
    {
      "description": "Bypass cache for API routes",
      "expression": "(http.host eq \"docs.villa.cash\" and starts_with(http.request.uri.path, \"/api\"))",
      "action": "set_cache_settings",
      "action_parameters": {
        "cache": false
      }
    },
    {
      "description": "Cache HTML pages for 1 hour with stale-while-revalidate",
      "expression": "(http.host eq \"docs.villa.cash\")",
      "action": "set_cache_settings",
      "action_parameters": {
        "cache": true,
        "edge_ttl": {
          "mode": "override_origin",
          "default": 3600
        },
        "browser_ttl": {
          "mode": "respect_origin"
        },
        "serve_stale": {
          "disable_stale_while_updating": false
        }
      }
    }
  ]'
  
  local data
  data=$(jq -n \
    --argjson rules "$rules" \
    '{
      "name": "villa-cache-rules",
      "kind": "zone",
      "phase": "http_request_cache_settings",
      "rules": $rules
    }')
  
  local response
  if [[ -n "$ruleset_id" ]]; then
    log_info "Updating existing ruleset: $ruleset_id"
    response=$(cf_api PUT "/zones/${CLOUDFLARE_ZONE_ID}/rulesets/$ruleset_id" "$data")
  else
    log_info "Creating new ruleset"
    response=$(cf_api POST "/zones/${CLOUDFLARE_ZONE_ID}/rulesets" "$data")
  fi
  
  if echo "$response" | grep -q '"success":true'; then
    log_success "Cache rules created/updated successfully"
    echo "$response" | jq '.result | {id, name, rules: [.rules[] | {description, expression}]}'
  else
    log_error "Failed to create cache rules"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    log_warn ""
    log_warn "Note: Cache Rules API requires a paid CloudFlare plan (Pro+)"
    log_warn "For free plans, use Page Rules in the dashboard or rely on origin headers."
  fi
}

main() {
  local cmd="${1:-list}"
  
  case "$cmd" in
    list)
      list_cache_rules
      ;;
    create)
      create_villa_cache_rules
      ;;
    *)
      cat <<EOF
CloudFlare Cache Rules management for Villa

Usage: $0 <command>

Commands:
  list      List existing cache rules
  create    Create/update cache rules for villa.cash

Cache Rules (requires Pro+ plan):
  1. Static assets (_next/static/*) - 1 year cache
  2. API routes (/api/*) - bypass cache
  3. HTML pages - 1 hour edge cache

For free plans, cache behavior is controlled by origin headers.
See: apps/developers/next.config.js

Verify cache status:
  curl -sI https://docs.villa.cash | grep -i "cf-cache-status"
  # HIT = served from CloudFlare edge
  # MISS = fetched from Railway origin
  # BYPASS = cache disabled for this request
EOF
      ;;
  esac
}

main "$@"
