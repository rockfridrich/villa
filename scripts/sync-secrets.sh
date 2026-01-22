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

check_gh_auth() {
  if ! gh auth status &>/dev/null; then
    log_error "GitHub CLI not authenticated. Run: gh auth login"
    exit 1
  fi
}

get_secret() {
  local name="$1"
  local value
  
  value=$(gh secret list --json name -q ".[] | select(.name == \"$name\") | .name" 2>/dev/null || echo "")
  
  if [[ -z "$value" ]]; then
    log_warn "Secret $name not found in GitHub"
    return 1
  fi
  
  echo "EXISTS"
  return 0
}

sync_cloudflare_secrets() {
  log_info "Syncing CloudFlare secrets from GitHub..."
  
  local secrets_to_sync=(
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ZONE_ID"
  )
  
  local missing=()
  
  for secret in "${secrets_to_sync[@]}"; do
    if get_secret "$secret" &>/dev/null; then
      log_success "$secret exists in GitHub secrets"
    else
      missing+=("$secret")
    fi
  done
  
  if [[ ${#missing[@]} -gt 0 ]]; then
    log_error "Missing secrets in GitHub: ${missing[*]}"
    log_info "Add them with: gh secret set <NAME>"
    return 1
  fi
  
  log_info ""
  log_info "GitHub secrets exist but cannot be read directly (write-only)."
  log_info "You need to manually set them in .env.local"
  log_info ""
  log_info "Option 1: Copy from 1Password/password manager"
  log_info "Option 2: Copy from CloudFlare dashboard"
  log_info "Option 3: Create new token at https://dash.cloudflare.com/profile/api-tokens"
  log_info ""
  
  return 0
}

create_env_template() {
  if [[ -f "$ENV_FILE" ]]; then
    if grep -q "CLOUDFLARE_API_TOKEN" "$ENV_FILE"; then
      log_info ".env.local already has CloudFlare variables"
      return 0
    fi
  fi
  
  log_info "Adding CloudFlare template to .env.local..."
  
  cat >> "$ENV_FILE" << 'EOF'

# CloudFlare (synced from GitHub secrets)
# Get from: https://dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
EOF

  log_success "Template added to .env.local"
  log_warn "You need to fill in the values manually"
}

validate_cloudflare_credentials() {
  log_info "Validating CloudFlare credentials..."
  
  source "$ENV_FILE" 2>/dev/null || true
  
  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    log_error "CLOUDFLARE_API_TOKEN not set in .env.local"
    return 1
  fi
  
  if [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
    log_error "CLOUDFLARE_ZONE_ID not set in .env.local"
    return 1
  fi
  
  local response
  response=$(curl -sf -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" 2>/dev/null || echo '{"success":false}')
  
  if echo "$response" | grep -q '"success":true'; then
    local zone_name
    zone_name=$(echo "$response" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_success "CloudFlare credentials valid for zone: $zone_name"
    return 0
  else
    log_error "CloudFlare API authentication failed"
    log_info "Check your token at https://dash.cloudflare.com/profile/api-tokens"
    return 1
  fi
}

cmd_sync() {
  check_gh_auth
  sync_cloudflare_secrets
  create_env_template
}

cmd_validate() {
  validate_cloudflare_credentials
}

cmd_set() {
  local name="${1:-}"
  local value="${2:-}"
  
  if [[ -z "$name" ]]; then
    log_error "Usage: ./scripts/sync-secrets.sh set <NAME> <VALUE>"
    exit 1
  fi
  
  if [[ -z "$value" ]]; then
    log_info "Enter value for $name (hidden):"
    read -rs value
    echo
  fi
  
  if [[ -z "$value" ]]; then
    log_error "Value cannot be empty"
    exit 1
  fi
  
  if grep -q "^${name}=" "$ENV_FILE" 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^${name}=.*|${name}=${value}|" "$ENV_FILE"
    else
      sed -i "s|^${name}=.*|${name}=${value}|" "$ENV_FILE"
    fi
    log_success "Updated $name in .env.local"
  else
    echo "${name}=${value}" >> "$ENV_FILE"
    log_success "Added $name to .env.local"
  fi
  
  log_info "Also updating GitHub secret..."
  echo "$value" | gh secret set "$name" 2>/dev/null && log_success "Updated $name in GitHub secrets" || log_warn "Could not update GitHub secret (check permissions)"
}

cmd_help() {
  cat <<EOF
Sync GitHub secrets to local environment

Usage: ./scripts/sync-secrets.sh <command>

Commands:
  sync      Check GitHub secrets and create .env.local template
  validate  Test CloudFlare credentials are valid
  set       Set a secret in both .env.local and GitHub
  help      Show this help

Examples:
  ./scripts/sync-secrets.sh sync
  ./scripts/sync-secrets.sh validate
  ./scripts/sync-secrets.sh set CLOUDFLARE_API_TOKEN "your-token"

Security:
  - Never commit .env.local to git
  - Use 'set' command to sync both local and GitHub
  - Validate credentials before operations
EOF
}

main() {
  local cmd="${1:-help}"
  shift || true
  
  case "$cmd" in
    sync)     cmd_sync "$@" ;;
    validate) cmd_validate "$@" ;;
    set)      cmd_set "$@" ;;
    help|--help|-h) cmd_help ;;
    *)
      log_error "Unknown command: $cmd"
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"
