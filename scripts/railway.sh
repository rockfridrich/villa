#!/usr/bin/env bash
# Railway CLI wrapper for agent-friendly operations
# Usage: ./scripts/railway.sh <command> [args...]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Check if Railway CLI is installed
check_railway() {
  if ! command -v railway &>/dev/null; then
    log_error "Railway CLI not installed. Run: brew install railway"
    exit 1
  fi
}

# Check authentication status
check_auth() {
  if railway whoami &>/dev/null; then
    return 0
  else
    return 1
  fi
}

# Login with browserless mode (returns pairing code)
cmd_login() {
  check_railway
  
  if check_auth; then
    local user
    user=$(railway whoami 2>/dev/null)
    log_success "Already logged in as: $user"
    return 0
  fi
  
  log_info "Starting browserless login..."
  log_warn "A pairing code will be displayed. Visit https://railway.app/cli-login to complete."
  echo ""
  
  # Run browserless login
  railway login --browserless
  
  if check_auth; then
    log_success "Login successful!"
    railway whoami
  else
    log_error "Login failed"
    exit 1
  fi
}

# Show current status
cmd_status() {
  check_railway
  
  echo "=== Railway Status ==="
  echo ""
  
  if check_auth; then
    echo "User: $(railway whoami 2>/dev/null)"
    echo ""
    
    if railway status &>/dev/null; then
      railway status
    else
      log_warn "No project linked in current directory"
      echo ""
      echo "Available projects:"
      railway list 2>/dev/null || log_warn "No projects found"
    fi
  else
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
}

# Initialize or link project
cmd_init() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  local project_name="${1:-villa}"
  
  log_info "Initializing Railway project: $project_name"
  
  # Check if already linked
  if railway status &>/dev/null; then
    log_warn "Already linked to a project"
    railway status
    return 0
  fi
  
  # Try to link existing project first
  if railway link "$project_name" &>/dev/null; then
    log_success "Linked to existing project: $project_name"
  else
    log_info "Creating new project: $project_name"
    railway init --name "$project_name"
  fi
  
  railway status
}

# Create a service
cmd_service_create() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  local service_name="${1:-}"
  
  if [[ -z "$service_name" ]]; then
    log_error "Usage: ./scripts/railway.sh service-create <name>"
    exit 1
  fi
  
  log_info "Creating service: $service_name"
  railway service create "$service_name"
  log_success "Service created: $service_name"
}

# Deploy a service
cmd_deploy() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  local service="${1:-}"
  
  if [[ -n "$service" ]]; then
    log_info "Deploying service: $service"
    railway up --service "$service"
  else
    log_info "Deploying current directory"
    railway up
  fi
}

# Set environment variables
cmd_vars_set() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  local service="${1:-}"
  shift || true
  
  if [[ -z "$service" ]] || [[ $# -eq 0 ]]; then
    log_error "Usage: ./scripts/railway.sh vars-set <service> KEY=value [KEY2=value2...]"
    exit 1
  fi
  
  log_info "Setting variables for service: $service"
  
  for var in "$@"; do
    railway variable set "$var" --service "$service"
    log_success "Set: $var"
  done
}

# Get environment variables
cmd_vars_get() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  local service="${1:-}"
  
  if [[ -n "$service" ]]; then
    railway variable list --service "$service"
  else
    railway variable list
  fi
}

# Add custom domain
cmd_domain() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  local service="${1:-}"
  local domain="${2:-}"
  
  if [[ -z "$service" ]]; then
    log_error "Usage: ./scripts/railway.sh domain <service> [custom-domain]"
    exit 1
  fi
  
  if [[ -n "$domain" ]]; then
    log_info "Adding custom domain $domain to service $service"
    railway domain add "$domain" --service "$service"
  else
    log_info "Generating Railway domain for service $service"
    railway domain --service "$service"
  fi
}

# View logs
cmd_logs() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  local service="${1:-}"
  
  if [[ -n "$service" ]]; then
    railway logs --service "$service"
  else
    railway logs
  fi
}

# List projects
cmd_list() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  railway list
}

# Full migration helper
cmd_migrate() {
  check_railway
  
  if ! check_auth; then
    log_error "Not authenticated. Run: ./scripts/railway.sh login"
    exit 1
  fi
  
  log_info "=== Villa Railway Migration ==="
  echo ""
  
  # 1. Initialize project
  log_info "Step 1: Initialize project"
  cmd_init "villa"
  echo ""
  
  # 2. Create services
  log_info "Step 2: Create services"
  local services=("villa-staging" "villa-developers" "villa-key-staging")
  
  for svc in "${services[@]}"; do
    if railway service "$svc" &>/dev/null; then
      log_warn "Service $svc already exists"
    else
      railway service create "$svc" || log_warn "Could not create $svc"
    fi
  done
  echo ""
  
  # 3. Set environment variables
  log_info "Step 3: Set environment variables"
  local common_vars=(
    "NODE_ENV=production"
    "NEXT_TELEMETRY_DISABLED=1"
  )
  
  for svc in "${services[@]}"; do
    log_info "Setting vars for $svc"
    for var in "${common_vars[@]}"; do
      railway variable set "$var" --service "$svc" 2>/dev/null || true
    done
  done
  echo ""
  
  # 4. Show next steps
  log_success "=== Migration Initialized ==="
  echo ""
  echo "Next steps:"
  echo "1. Deploy services:"
  echo "   railway up --service villa-staging"
  echo "   railway up --service villa-developers"
  echo "   railway up --service villa-key-staging"
  echo ""
  echo "2. Add custom domains:"
  echo "   railway domain add beta.villa.cash --service villa-staging"
  echo "   railway domain add docs.villa.cash --service villa-developers"
  echo "   railway domain add beta-key.villa.cash --service villa-key-staging"
  echo ""
  echo "3. Update CloudFlare DNS to point to Railway"
}

# Help
cmd_help() {
  cat <<EOF
Railway CLI wrapper for Villa

Usage: ./scripts/railway.sh <command> [args...]

Commands:
  login              Login to Railway (browserless mode)
  status             Show current status
  init [name]        Initialize or link project
  list               List all projects
  service-create <n> Create a new service
  deploy [service]   Deploy current directory or specific service
  vars-set <svc> K=V Set environment variables
  vars-get [service] Get environment variables
  domain <svc> [dom] Add domain to service
  logs [service]     View logs
  migrate            Run full migration helper

Examples:
  ./scripts/railway.sh login
  ./scripts/railway.sh status
  ./scripts/railway.sh init villa
  ./scripts/railway.sh service-create villa-staging
  ./scripts/railway.sh deploy villa-staging
  ./scripts/railway.sh vars-set villa-staging NODE_ENV=production
  ./scripts/railway.sh domain villa-staging beta.villa.cash
EOF
}

# Main
main() {
  local cmd="${1:-help}"
  shift || true
  
  case "$cmd" in
    login)          cmd_login "$@" ;;
    status)         cmd_status "$@" ;;
    init)           cmd_init "$@" ;;
    list)           cmd_list "$@" ;;
    service-create) cmd_service_create "$@" ;;
    deploy)         cmd_deploy "$@" ;;
    vars-set)       cmd_vars_set "$@" ;;
    vars-get)       cmd_vars_get "$@" ;;
    domain)         cmd_domain "$@" ;;
    logs)           cmd_logs "$@" ;;
    migrate)        cmd_migrate "$@" ;;
    help|--help|-h) cmd_help ;;
    *)
      log_error "Unknown command: $cmd"
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"
