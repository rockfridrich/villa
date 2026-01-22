#!/usr/bin/env bash
set -e

PROJECT_ID="7c344004-cd63-4b10-8479-9991c3923115"

get_service_info() {
  local app=$1
  case "$app" in
    hub) echo "villa-staging:construction.villa.cash" ;;
    developers) echo "villa-developers:developers.villa.cash" ;;
    key) echo "villa-key-staging:fake-key.villa.cash" ;;
    *) echo "" ;;
  esac
}

usage() {
  echo "Usage: $0 <service> [--wait]"
  echo ""
  echo "Services:"
  echo "  hub         - Deploy to construction.villa.cash"
  echo "  developers  - Deploy to developers.villa.cash"
  echo "  key         - Deploy to fake-key.villa.cash"
  echo "  all         - Deploy all services"
  echo ""
  echo "Options:"
  echo "  --wait      Wait for deployment to complete"
  echo ""
  echo "Examples:"
  echo "  $0 developers"
  echo "  $0 hub --wait"
  echo "  $0 all"
  exit 1
}

deploy_service() {
  local app=$1
  local wait=$2
  local service_info=$(get_service_info "$app")
  local service_name=${service_info%%:*}
  local domain=${service_info##*:}
  
  if [ -z "$service_info" ]; then
    echo "Unknown service: $app"
    exit 1
  fi
  
  echo "═══════════════════════════════════════════"
  echo "Deploying $app → $domain"
  echo "═══════════════════════════════════════════"
  
  if [ -f "railway.toml" ]; then
    mv railway.toml railway.toml.bak
  fi
  
  if [ -f "apps/$app/railway.toml" ]; then
    cp "apps/$app/railway.toml" railway.toml
  fi
  
  railway link -p villa -s "$service_name" 2>/dev/null || true
  
  if [ "$wait" = "true" ]; then
    railway up 2>&1
  else
    railway up --detach 2>&1
  fi
  
  if [ -f "railway.toml" ]; then
    rm railway.toml
  fi
  
  if [ -f "railway.toml.bak" ]; then
    mv railway.toml.bak railway.toml
  fi
  
  echo ""
  echo "Deploy initiated: https://$domain"
  echo "Logs: https://railway.com/project/$PROJECT_ID"
  echo ""
}

verify_service() {
  local app=$1
  local service_info=$(get_service_info "$app")
  local domain=${service_info##*:}
  
  echo -n "Verifying $domain... "
  
  local health_path="/api/health"
  if [ "$app" = "developers" ]; then
    health_path="/"
  fi
  
  if curl -sf "https://$domain$health_path" > /dev/null 2>&1; then
    echo "✓ OK"
    return 0
  else
    echo "✗ FAIL"
    return 1
  fi
}

if [ $# -lt 1 ]; then
  usage
fi

SERVICE=$1
WAIT="false"
if [ "$2" = "--wait" ]; then
  WAIT="true"
fi

cd "$(dirname "$0")/.."

if ! command -v railway &> /dev/null; then
  echo "Error: Railway CLI not installed"
  echo "Install: npm install -g @railway/cli"
  exit 1
fi

if [ "$SERVICE" = "all" ]; then
  for app in hub developers key; do
    deploy_service "$app" "$WAIT"
  done
  
  echo "═══════════════════════════════════════════"
  echo "Verifying deployments..."
  echo "═══════════════════════════════════════════"
  sleep 30
  for app in hub developers key; do
    verify_service "$app" || true
  done
else
  deploy_service "$SERVICE" "$WAIT"
  
  if [ "$WAIT" = "true" ]; then
    echo "Verifying deployment..."
    sleep 10
    verify_service "$SERVICE"
  fi
fi
