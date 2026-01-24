#!/bin/bash
# Villa Full Local Development
#
# Runs all apps simultaneously with HTTPS via Caddy
#
# Port Scheme:
#   3000 - Hub (local.villa.cash)
#   3001 - Key (local-key.villa.cash)
#   3002 - Developers (local-docs.villa.cash)
#   3003 - Telemetry (localhost only)
#   443  - Caddy HTTPS proxy
#   5432 - PostgreSQL
#
# Usage:
#   ./scripts/dev-all.sh          # All apps with HTTPS
#   ./scripts/dev-all.sh --no-db  # Skip database

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SKIP_DB=false
[[ "$1" == "--no-db" ]] && SKIP_DB=true

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    pkill -f "next dev" 2>/dev/null || true
    docker compose down 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Villa Full Local Development               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

if ! command -v docker &> /dev/null || ! docker info &> /dev/null 2>&1; then
    echo -e "${RED}✗ Docker not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker"

if ! command -v bun &> /dev/null; then
    echo -e "${RED}✗ bun not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} bun $(bun -v)"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    bun install
fi

HOSTS_OK=false
if grep -q "local.villa.cash" /etc/hosts 2>/dev/null; then
    HOSTS_OK=true
    echo -e "${GREEN}✓${NC} /etc/hosts configured"
else
    echo -e "${YELLOW}!${NC} Add to /etc/hosts for full experience:"
    echo -e "   ${CYAN}127.0.0.1 local.villa.cash local-key.villa.cash local-docs.villa.cash${NC}"
fi
echo ""

echo -e "${YELLOW}Starting infrastructure...${NC}"
if [ "$SKIP_DB" = false ]; then
    docker compose up -d postgres caddy
else
    docker compose up -d caddy
fi

echo -n "Waiting for Caddy"
for i in {1..15}; do
    if curl -sk "https://localhost/caddy-health" 2>/dev/null | grep -q "OK"; then
        break
    fi
    echo -n "."
    sleep 1
done
echo ""
echo -e "${GREEN}✓${NC} Infrastructure ready"
echo ""

echo -e "${YELLOW}Starting apps...${NC}"
echo ""

cd "$PROJECT_ROOT/apps/hub" && bun dev &
HUB_PID=$!

cd "$PROJECT_ROOT/apps/key" && bun dev &
KEY_PID=$!

cd "$PROJECT_ROOT/apps/developers" && bun dev &
DOCS_PID=$!

sleep 5

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}All services running:${NC}"
echo ""
if [ "$HOSTS_OK" = true ]; then
    echo -e "  Hub:        ${CYAN}https://local.villa.cash${NC}          (port 3000)"
    echo -e "  Key:        ${CYAN}https://local-key.villa.cash${NC}      (port 3001)"
    echo -e "  Docs:       ${CYAN}https://local-docs.villa.cash${NC}     (port 3002)"
else
    echo -e "  Hub:        ${CYAN}http://localhost:3000${NC}"
    echo -e "  Key:        ${CYAN}http://localhost:3001${NC}"
    echo -e "  Docs:       ${CYAN}http://localhost:3002${NC}"
fi
echo ""
echo -e "  Playground: ${CYAN}http://localhost:3002/playground${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

wait $HUB_PID $KEY_PID $DOCS_PID
