#!/bin/bash
# Run unit tests with vitest

cd "$(dirname "$0")/.." || exit 1

echo "Running unit tests..."
npx vitest run --config vitest.config.unit.ts
