#!/bin/bash
# Run tests
# Usage: ./scripts/test.sh [--all|--e2e|--unit|--quick]

set -e

MODE="${1:---quick}"

case "$MODE" in
  --all)
    echo "Running full test suite..."
    npm run verify
    ;;
  --e2e)
    echo "Running E2E tests..."
    npm run test:e2e
    ;;
  --e2e-ui)
    echo "Opening Playwright UI..."
    npm run test:e2e:ui
    ;;
  --unit)
    echo "Running unit tests..."
    npm run test:unit
    ;;
  --quick)
    echo "Running quick verification (typecheck + chromium e2e)..."
    npm run typecheck
    npm run test:e2e:chromium
    ;;
  *)
    echo "Usage: ./scripts/test.sh [--all|--e2e|--e2e-ui|--unit|--quick]"
    echo ""
    echo "Options:"
    echo "  --quick   Typecheck + Chromium E2E (default, fastest)"
    echo "  --e2e     All E2E tests (all browsers)"
    echo "  --e2e-ui  Open Playwright UI for debugging"
    echo "  --unit    Unit tests only"
    echo "  --all     Full verification (typecheck + build + all tests)"
    exit 1
    ;;
esac

echo ""
echo "Tests passed!"
