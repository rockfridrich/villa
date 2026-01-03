#!/bin/bash
# Verify test setup and run unit tests

set -e

echo "🧪 Villa Unit Test Verification"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run 'npm install' first."
    exit 1
fi

# Check if jsdom is installed
if ! npm list jsdom > /dev/null 2>&1; then
    echo "❌ jsdom not installed. Run 'npm install -D jsdom'"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Type check test files
echo "🔍 Type checking test files..."
if npx tsc --noEmit tests/unit/*.test.ts 2>&1 | grep -q "error TS"; then
    echo "❌ Type errors found in tests"
    npx tsc --noEmit tests/unit/*.test.ts
    exit 1
else
    echo "✅ No type errors"
fi
echo ""

# Run unit tests
echo "🧪 Running unit tests..."
echo ""
npm run test:unit

echo ""
echo "================================"
echo "✅ All tests passed!"
echo ""
echo "Next steps:"
echo "  - Run 'npm run test:watch' for watch mode"
echo "  - Run 'npm test' for all test suites"
echo "  - Run 'npm run verify' for full verification"
