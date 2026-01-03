#!/bin/bash
# Deploy to Digital Ocean
# Usage: ./scripts/deploy.sh [--create|--update]

set -e

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "Error: doctl (Digital Ocean CLI) is not installed"
    echo ""
    echo "Install with:"
    echo "  macOS: brew install doctl"
    echo "  Linux: snap install doctl"
    echo ""
    echo "Then authenticate:"
    echo "  doctl auth init"
    exit 1
fi

MODE="${1:---update}"

case "$MODE" in
  --create)
    echo "Creating new Digital Ocean app..."
    doctl apps create --spec .do/app.yaml
    echo ""
    echo "App created! It will be available at the URL shown above."
    ;;
  --update)
    echo "Updating Digital Ocean app..."
    # Get app ID from existing apps
    APP_ID=$(doctl apps list --format ID --no-header | head -1)
    if [ -z "$APP_ID" ]; then
      echo "No existing app found. Use --create to create one."
      exit 1
    fi
    doctl apps update "$APP_ID" --spec .do/app.yaml
    echo ""
    echo "App updated! Deployment in progress."
    ;;
  --logs)
    APP_ID=$(doctl apps list --format ID --no-header | head -1)
    doctl apps logs "$APP_ID" --follow
    ;;
  --status)
    doctl apps list
    ;;
  *)
    echo "Usage: ./scripts/deploy.sh [--create|--update|--logs|--status]"
    echo ""
    echo "Options:"
    echo "  --create  Create new app on Digital Ocean"
    echo "  --update  Update existing app (default)"
    echo "  --logs    Follow deployment logs"
    echo "  --status  Show app status"
    exit 1
    ;;
esac
