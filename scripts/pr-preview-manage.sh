#!/usr/bin/env bash
# PR Preview Environment Management Script
# Manage Railway PR preview environments manually

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

check_requirements() {
  if ! command -v railway &>/dev/null; then
    log_error "Railway CLI not installed. Run: curl -fsSL https://railway.com/install.sh | sh"
    exit 1
  fi
  
  if ! railway whoami &>/dev/null; then
    log_error "Not authenticated with Railway. Run: railway login"
    exit 1
  fi
  
  if [ -z "${RAILWAY_TOKEN:-}" ]; then
    log_warn "RAILWAY_TOKEN not set. Some operations may require it."
  fi
}

generate_shard_name() {
  local pr_number="$1"
  local date="${2:-$(date +%Y-%m-%d)}"
  echo "villa-shard-${pr_number}-${date}"
}

cmd_list() {
  log_info "Listing PR preview environments..."
  
  railway environment --json | jq -r '
    .[] | 
    select(.name | test("^villa-shard-\\d+-\\d{4}-\\d{2}-\\d{2}$")) |
    [.name, .id] | @tsv
  ' | while IFS=$'\t' read -r name id; do
    if [ -n "$name" ]; then
      local pr_num=$(echo "$name" | sed -n 's/villa-shard-\([0-9]*\)-.*/\1/p')
      local date=$(echo "$name" | sed -n 's/.*-\([0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]\)$/\1/p')
      echo "PR #$pr_num | $date | $name | $id"
    fi
  done
}

cmd_deploy() {
  local pr_number="$1"
  
  if [ -z "$pr_number" ]; then
    log_error "Usage: $0 deploy <pr_number>"
    exit 1
  fi
  
  local shard_name
  shard_name=$(generate_shard_name "$pr_number")
  
  log_info "Deploying PR preview environment for PR #$pr_number"
  log_info "Shard name: $shard_name"
  
  log_info "Creating environment: $shard_name"
  railway environment create "$shard_name" || log_warn "Environment may already exist"
  
  railway environment --name "$shard_name"
  
  local services=("villa-hub-pr-$pr_number" "villa-key-pr-$pr_number" "villa-docs-pr-$pr_number")
  local dockerfiles=("Dockerfile" "apps/key/Dockerfile" "apps/developers/Dockerfile")
  
  for i in "${!services[@]}"; do
    local service="${services[$i]}"
    local dockerfile="${dockerfiles[$i]}"
    
    log_info "Creating service: $service"
    railway service create "$service" || log_warn "Service may already exist"
    
    log_info "Deploying service: $service"
    railway service --service-name "$service"
    
    railway variable set NODE_ENV=production
    railway variable set NEXT_TELEMETRY_DISABLED=1
    railway variable set NEXT_PUBLIC_ENVIRONMENT=preview
    railway variable set NEXT_PUBLIC_PR_NUMBER="$pr_number"
    
    railway up --dockerfile "$dockerfile"
    
    log_success "Service deployed: $service"
  done
  
  log_success "PR preview environment deployed for PR #$pr_number"
}

cmd_destroy() {
  local pr_number="$1"
  
  if [ -z "$pr_number" ]; then
    log_error "Usage: $0 destroy <pr_number>"
    exit 1
  fi
  
  log_info "Destroying PR preview environment for PR #$pr_number"
  
  local matching_envs
  matching_envs=$(railway environment --json | jq -r --arg pr "$pr_number" '
    .[] | 
    select(.name | contains("villa-shard-" + $pr + "-")) | 
    .name
  ')
  
  if [ -z "$matching_envs" ]; then
    log_warn "No matching environments found for PR #$pr_number"
    return 0
  fi
  
  echo "$matching_envs" | while read -r env_name; do
    if [ -n "$env_name" ]; then
      log_info "Removing environment: $env_name"
      
      railway environment --name "$env_name"
      
      local services
      services=$(railway service --json 2>/dev/null | jq -r '.[].name' || echo "")
      
      if [ -n "$services" ]; then
        echo "$services" | while read -r service; do
          if [ -n "$service" ]; then
            log_info "  Removing service: $service"
            railway service delete "$service" --yes 2>/dev/null || true
          fi
        done
      fi
      
      railway environment delete "$env_name" --yes
      log_success "Environment removed: $env_name"
    fi
  done
}

cmd_status() {
  local pr_number="$1"
  
  if [ -z "$pr_number" ]; then
    log_error "Usage: $0 status <pr_number>"
    exit 1
  fi
  
  log_info "Status for PR #$pr_number"
  
  local matching_envs
  matching_envs=$(railway environment --json | jq -r --arg pr "$pr_number" '
    .[] | 
    select(.name | contains("villa-shard-" + $pr + "-")) | 
    .name
  ')
  
  if [ -z "$matching_envs" ]; then
    log_warn "No environments found for PR #$pr_number"
    return 0
  fi
  
  echo "$matching_envs" | while read -r env_name; do
    if [ -n "$env_name" ]; then
      log_info "Environment: $env_name"
      
      railway environment --name "$env_name"
      railway status 2>/dev/null || log_warn "Could not get status for $env_name"
    fi
  done
}

cmd_cleanup() {
  local days="${1:-7}"
  
  log_info "Cleaning up environments older than $days days..."
  
  local cutoff_date
  cutoff_date=$(date -d "$days days ago" +%Y-%m-%d)
  
  local old_envs
  old_envs=$(railway environment --json | jq -r --arg cutoff "$cutoff_date" '
    .[] | 
    select(.name | test("^villa-shard-\\d+-\\d{4}-\\d{2}-\\d{2}$")) |
    select((.name | split("-")[-1]) < $cutoff) |
    .name
  ')
  
  if [ -z "$old_envs" ]; then
    log_success "No old environments to clean up"
    return 0
  fi
  
  echo "$old_envs" | while read -r env_name; do
    if [ -n "$env_name" ]; then
      log_info "Removing old environment: $env_name"
      
      railway environment --name "$env_name"
      
      local services
      services=$(railway service --json 2>/dev/null | jq -r '.[].name' || echo "")
      
      if [ -n "$services" ]; then
        echo "$services" | while read -r service; do
          if [ -n "$service" ]; then
            railway service delete "$service" --yes 2>/dev/null || true
          fi
        done
      fi
      
      railway environment delete "$env_name" --yes 2>/dev/null || true
      log_success "Cleaned up: $env_name"
    fi
  done
}

cmd_help() {
  cat <<EOF
PR Preview Environment Management

Usage: $0 <command> [args...]

Commands:
  list                    List all PR preview environments
  deploy <pr_number>      Deploy preview environment for PR
  destroy <pr_number>     Remove preview environment for PR
  status <pr_number>      Show status of PR preview environment
  cleanup [days]          Cleanup environments older than N days (default: 7)
  help                    Show this help

Examples:
  $0 list
  $0 deploy 123
  $0 status 123
  $0 destroy 123
  $0 cleanup 14
EOF
}

main() {
  check_requirements
  
  local cmd="${1:-help}"
  shift || true
  
  case "$cmd" in
    list)     cmd_list "$@" ;;
    deploy)   cmd_deploy "$@" ;;
    destroy)  cmd_destroy "$@" ;;
    status)   cmd_status "$@" ;;
    cleanup)  cmd_cleanup "$@" ;;
    help|--help|-h) cmd_help ;;
    *)
      log_error "Unknown command: $cmd"
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"