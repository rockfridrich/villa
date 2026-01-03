#!/bin/bash
# Start local development environment
# Usage: ./scripts/dev.sh [--docker|--native]

set -e

MODE="${1:---native}"

case "$MODE" in
  --docker)
    echo "Starting Docker development environment..."
    echo "App will be available at https://localhost"
    docker compose up --build
    ;;
  --native)
    echo "Starting native development environment..."
    echo "App will be available at http://localhost:3000"
    npm run dev:clean
    ;;
  --https)
    echo "Starting native development with HTTPS..."
    echo "App will be available at https://localhost:3000"
    npm run dev:https
    ;;
  *)
    echo "Usage: ./scripts/dev.sh [--docker|--native|--https]"
    echo ""
    echo "Options:"
    echo "  --native  Start with npm (default, http://localhost:3000)"
    echo "  --https   Start with npm + HTTPS (https://localhost:3000)"
    echo "  --docker  Start with Docker + Caddy (https://localhost)"
    exit 1
    ;;
esac
