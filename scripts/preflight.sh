#!/bin/bash
# Pre-flight checks before Docker work
# Usage: ./scripts/preflight.sh

set -e

echo "=== Villa Pre-flight Check ==="

# Check Colima
if colima status > /dev/null 2>&1; then
    echo "[OK] Colima running"
else
    echo "[!!] Colima not running"
    echo "    Run: colima start"
    exit 1
fi

# Check Docker
if docker info > /dev/null 2>&1; then
    echo "[OK] Docker connected"
else
    echo "[!!] Docker not connected"
    echo "    Check: colima status"
    exit 1
fi

# Check ports
if lsof -i :443 > /dev/null 2>&1; then
    echo "[!!] Port 443 in use"
    lsof -i :443 | head -2
else
    echo "[OK] Port 443 available"
fi

if lsof -i :80 > /dev/null 2>&1; then
    echo "[!!] Port 80 in use"
    lsof -i :80 | head -2
else
    echo "[OK] Port 80 available"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    echo "[OK] node_modules exists"
else
    echo "[!!] node_modules missing"
    echo "    Run: npm install"
fi

echo ""
echo "Ready for Docker work!"
echo "  Start: docker compose up --build"
echo "  Logs:  docker compose logs -f"
