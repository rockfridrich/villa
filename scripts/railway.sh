#!/usr/bin/env bash
# Villa Railway Management
# Usage: bun railway:<command> or ./scripts/railway.sh <command>
# Compatible with macOS bash 3.2+

set -euo pipefail

# — Config —————————————————————————————————————————————————
PROJECT_ID="7c344004-cd63-4b10-8479-9991c3923115"
RAILWAY_API="https://backboard.railway.app/graphql/v2"
ENV_ID="00c94bb8-6243-44b5-b230-a2e957b1d0fb"

# Service IDs
SVC_ID_HUB="bd74de16-7d2c-461c-a7a3-7f8457e9789a"
SVC_ID_KEY="47cd138f-6242-42cd-afa2-66cf67342cc3"
SVC_ID_DEV="76259946-3a5b-4315-a4e2-1e07dbcbd720"
SVC_ID_PG="e871a404-620e-4638-a2e9-94b812523de2"

# Domains
DOMAIN_HUB="villa.cash"
DOMAIN_KEY="key.villa.cash"
DOMAIN_DEV="docs.villa.cash"

# Dockerfiles
DOCKER_HUB="apps/hub/Dockerfile"
DOCKER_KEY="apps/key/Dockerfile"
DOCKER_DEV="apps/developers/Dockerfile"

# — Helpers ————————————————————————————————————————————————
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; DIM='\033[2m'; NC='\033[0m'

info()    { echo -e "${BLUE}▸${NC} $*"; }
ok()      { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC} $*"; }
err()     { echo -e "${RED}✗${NC} $*" >&2; }
dim()     { echo -e "${DIM}$*${NC}"; }

svc_id() {
  case "$1" in
    hub)        echo "$SVC_ID_HUB" ;;
    key)        echo "$SVC_ID_KEY" ;;
    developers) echo "$SVC_ID_DEV" ;;
    postgres)   echo "$SVC_ID_PG" ;;
    *) err "Unknown service: $1"; return 1 ;;
  esac
}

svc_name() {
  case "$1" in
    hub)        echo "villa-staging" ;;
    key)        echo "villa-key-staging" ;;
    developers) echo "villa-developers" ;;
    postgres)   echo "Postgres" ;;
  esac
}

svc_domain() {
  case "$1" in
    hub)        echo "$DOMAIN_HUB" ;;
    key)        echo "$DOMAIN_KEY" ;;
    developers) echo "$DOMAIN_DEV" ;;
    *) echo "—" ;;
  esac
}

svc_dockerfile() {
  case "$1" in
    hub)        echo "$DOCKER_HUB" ;;
    key)        echo "$DOCKER_KEY" ;;
    developers) echo "$DOCKER_DEV" ;;
  esac
}

# — Auth ———————————————————————————————————————————————————
get_token() {
  # 1. RAILWAY_TOKEN from environment
  if [ -n "${RAILWAY_TOKEN:-}" ]; then
    echo "$RAILWAY_TOKEN"
    return 0
  fi

  # 2. Railway CLI config (~/.railway/config.json — from `railway login`)
  local cli_config="$HOME/.railway/config.json"
  if [ -f "$cli_config" ]; then
    local cli_token
    cli_token=$(jq -r '.user.token // empty' "$cli_config" 2>/dev/null || true)
    if [ -n "$cli_token" ]; then
      echo "$cli_token"
      return 0
    fi
  fi

  # 3. .env.local fallback
  local env_file
  env_file="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env.local"
  if [ -f "$env_file" ]; then
    local file_token
    file_token=$(grep -E '^RAILWAY_TOKEN=' "$env_file" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
    if [ -n "$file_token" ]; then
      echo "$file_token"
      return 0
    fi
  fi

  err "No Railway token found. Run: railway login"
  return 1
}

# — GraphQL ————————————————————————————————————————————————
gql() {
  local query="$1"
  local token
  token=$(get_token)

  curl -sf -X POST "$RAILWAY_API" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$query" | jq -Rs .)}" 2>/dev/null
}

# — Commands ———————————————————————————————————————————————

cmd_status() {
  info "Railway Services — Project $PROJECT_ID"
  echo ""

  local query="query {
    project(id: \"$PROJECT_ID\") {
      name
      services { edges { node { id name } } }
    }
  }"

  local result
  result=$(gql "$query")

  if [ -z "$result" ] || echo "$result" | jq -e '.errors' &>/dev/null; then
    err "API call failed. Check your token."
    echo "$result" | jq '.errors[0].message' 2>/dev/null || true
    return 1
  fi

  local project_name
  project_name=$(echo "$result" | jq -r '.data.project.name')
  ok "Project: $project_name"
  echo ""

  printf "  %-20s %-40s %s\n" "SERVICE" "ID" "DOMAIN"
  printf "  %-20s %-40s %s\n" "-------" "--" "------"

  echo "$result" | jq -r '.data.project.services.edges[].node | "\(.name) \(.id)"' | while read -r name id; do
    local domain="—"
    case "$name" in
      villa-staging)      domain="$DOMAIN_HUB" ;;
      villa-key-staging)  domain="$DOMAIN_KEY" ;;
      villa-developers)   domain="$DOMAIN_DEV" ;;
    esac
    printf "  %-20s %-40s %s\n" "$name" "$id" "$domain"
  done

  echo ""
  info "Health checks:"
  for svc in hub key developers; do
    local url="https://$(svc_domain "$svc")/api/health"
    local status
    status=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    if [ "$status" = "200" ]; then
      ok "  $(svc_domain "$svc") → $status"
    else
      warn "  $(svc_domain "$svc") → $status"
    fi
  done
}

cmd_setup() {
  info "Configuring all services → Dockerfile builder"
  echo ""

  for svc in hub key developers; do
    local service_id dockerfile name config_file
    service_id=$(svc_id "$svc")
    dockerfile=$(svc_dockerfile "$svc")
    name=$(svc_name "$svc")
    config_file="apps/$svc/railway.toml"

    info "Configuring $name → $dockerfile"

    local query="mutation {
      serviceInstanceUpdate(
        serviceId: \"$service_id\"
        environmentId: \"$ENV_ID\"
        input: {
          dockerfilePath: \"$dockerfile\"
          healthcheckPath: \"/api/health\"
          railwayConfigFile: \"$config_file\"
        }
      )
    }"

    local result
    result=$(gql "$query")

    if echo "$result" | jq -e '.data.serviceInstanceUpdate' &>/dev/null; then
      ok "  $name configured"
    else
      err "  Failed to configure $name"
      echo "$result" | jq -r '.errors[0].message' 2>/dev/null || echo "$result"
    fi
  done

  echo ""
  ok "Setup complete. Run: bun railway:deploy"
}

cmd_deploy() {
  local target="${1:-all}"
  info "Triggering redeploy..."
  echo ""

  _deploy_one() {
    local svc="$1"
    local service_id name
    service_id=$(svc_id "$svc")
    name=$(svc_name "$svc")

    info "Deploying $name..."

    local query="mutation {
      serviceInstanceRedeploy(
        serviceId: \"$service_id\"
        environmentId: \"$ENV_ID\"
      )
    }"

    local result
    result=$(gql "$query")

    if echo "$result" | jq -e '.data.serviceInstanceRedeploy' &>/dev/null; then
      ok "  $name deploy triggered"
    else
      err "  Failed to deploy $name"
      echo "$result" | jq -r '.errors[0].message' 2>/dev/null || echo "$result"
    fi
  }

  case "$target" in
    all)
      _deploy_one hub
      _deploy_one key
      _deploy_one developers
      ;;
    hub|key|developers)
      _deploy_one "$target"
      ;;
    *)
      err "Unknown service: $target (use hub, key, developers, or all)"
      return 1
      ;;
  esac

  echo ""
  dim "Monitor at: https://railway.com/project/$PROJECT_ID"
}

cmd_logs() {
  local target="${1:-hub}"

  if ! command -v railway &>/dev/null; then
    err "Railway CLI required for logs. Run: brew install railway"
    return 1
  fi

  local name
  name=$(svc_name "$target" 2>/dev/null || true)
  if [ -z "$name" ]; then
    err "Unknown service: $target (use hub, key, or developers)"
    return 1
  fi

  info "Logs for $name (last 50 lines)"
  railway logs --service "$name" --tail 50 2>/dev/null || \
    warn "Could not fetch logs via CLI. Check Railway dashboard."
}

cmd_vars() {
  local target="${1:-}"

  if [ -z "$target" ]; then
    info "Environment variables for all services:"
    echo ""
    for svc in hub key developers; do
      _show_vars "$svc"
    done
  else
    _show_vars "$target"
  fi
}

_show_vars() {
  local svc="$1"
  local service_id name
  service_id=$(svc_id "$svc" 2>/dev/null || true)
  name=$(svc_name "$svc" 2>/dev/null || echo "$svc")

  if [ -z "$service_id" ]; then
    err "Unknown service: $svc"
    return 1
  fi

  info "$name:"

  local query="query {
    variables(
      projectId: \"$PROJECT_ID\"
      environmentId: \"$ENV_ID\"
      serviceId: \"$service_id\"
    )
  }"

  local result
  result=$(gql "$query")

  if echo "$result" | jq -e '.data.variables' &>/dev/null; then
    echo "$result" | jq -r '.data.variables | to_entries[] | "  \(.key)=\(.value)"' 2>/dev/null
  else
    warn "  Could not fetch variables"
  fi
  echo ""
}

cmd_health() {
  info "Health checks"
  echo ""

  local all_ok=true

  for svc in hub key developers; do
    local url="https://$(svc_domain "$svc")/api/health"
    local response status
    response=$(curl -sf "$url" 2>/dev/null || echo '{"status":"unreachable"}')
    status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null || echo "error")

    if [ "$status" = "ok" ] || [ "$status" = "healthy" ]; then
      ok "$(svc_domain "$svc") → $status"
    else
      warn "$(svc_domain "$svc") → $status"
      all_ok=false
    fi
  done

  echo ""
  if $all_ok; then
    ok "All services healthy"
  else
    warn "Some services unhealthy. Run: bun railway:logs <service>"
  fi
}

cmd_connect() {
  info "GitHub repo connection"
  echo ""
  dim "GitHub sync must be configured in Railway Dashboard:"
  dim "  1. Go to https://railway.com/project/$PROJECT_ID"
  dim "  2. Click each service → Settings → Source"
  dim "  3. Connect: rockfridrich/villa"
  dim "  4. Branch: main"
  dim "  5. Config path: apps/<app>/railway.toml"
  echo ""
  dim "Config paths:"
  for svc in hub key developers; do
    dim "  $svc → apps/$svc/railway.toml (Dockerfile: $(svc_dockerfile "$svc"))"
  done
  echo ""
  warn "After connecting, push to main triggers auto-deploy."
}

cmd_whoami() {
  local token
  token=$(get_token 2>/dev/null || true)

  if [ -z "$token" ]; then
    err "No token available"
    return 1
  fi

  local result
  result=$(gql "query { me { name email } }")

  if echo "$result" | jq -e '.data.me' &>/dev/null; then
    local name email
    name=$(echo "$result" | jq -r '.data.me.name')
    email=$(echo "$result" | jq -r '.data.me.email')
    ok "Authenticated: $name ($email)"
  else
    err "Token invalid or expired"
    dim "Run: railway login"
    return 1
  fi
}

cmd_help() {
  cat <<'EOF'
Villa Railway Management

Usage: bun railway:<command> or ./scripts/railway.sh <command>

Commands:
  status              Show all services, IDs, domains, and health
  setup               Configure all services → Dockerfile builder
  deploy [service]    Trigger redeploy (hub|key|developers|all)
  logs <service>      Show recent logs (requires railway CLI)
  vars [service]      Show environment variables
  health              Check health endpoints
  connect             Show GitHub sync setup instructions
  whoami              Check authentication status

Examples:
  bun railway:status          # Overview of all services
  bun railway:setup           # Fix builder config → Dockerfile
  bun railway:deploy          # Redeploy all services
  bun railway:deploy hub      # Redeploy hub only
  bun railway:health          # Check all health endpoints
  bun railway:logs hub        # View hub logs
  bun railway:vars hub        # View hub env vars
EOF
}

# — Main ———————————————————————————————————————————————————
main() {
  local cmd="${1:-help}"
  shift || true

  case "$cmd" in
    status)   cmd_status "$@" ;;
    setup)    cmd_setup "$@" ;;
    deploy)   cmd_deploy "$@" ;;
    logs)     cmd_logs "$@" ;;
    vars)     cmd_vars "$@" ;;
    health)   cmd_health "$@" ;;
    connect)  cmd_connect "$@" ;;
    whoami)   cmd_whoami "$@" ;;
    help|-h)  cmd_help ;;
    *)
      err "Unknown command: $cmd"
      cmd_help
      return 1
      ;;
  esac
}

main "$@"
