#!/bin/bash
# Build for production
# Usage: ./scripts/build.sh [--docker|--native]

set -e

MODE="${1:---native}"

case "$MODE" in
  --docker)
    echo "Building Docker production image..."
    docker build -t villa:latest .
    echo ""
    echo "Done! Run with: docker run -p 3000:3000 villa:latest"
    ;;
  --native)
    echo "Building native production build..."
    npm run build
    echo ""
    echo "Done! Run with: npm start"
    ;;
  *)
    echo "Usage: ./scripts/build.sh [--docker|--native]"
    exit 1
    ;;
esac
