#!/usr/bin/env bash
set -euo pipefail

# Navigate to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Count TypeScript files (excluding node_modules, .next, dist)
ts_files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/.turbo/*" \
  | wc -l | tr -d ' ')

# Count total lines of code in TS files
loc=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/.turbo/*" \
  -exec wc -l {} + | tail -1 | awk '{print $1}')

# Count `any` type usages (: any, <any>, any[])
any_count=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/.turbo/*" \
  -exec grep -oh '\(: any\|<any>\|any\[\]\)' {} \; 2>/dev/null | wc -l | tr -d ' ')

# Count test files
test_files=$(find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) \
  -not -path "*/node_modules/*" \
  | wc -l | tr -d ' ')

# Count dependencies from root package.json
if [ -f "package.json" ]; then
  deps=$(jq -r '(.dependencies // {} | length) + (.devDependencies // {} | length)' package.json)
else
  deps="N/A"
fi

# Count packages (apps/* + packages/*)
packages=$(find apps packages -maxdepth 1 -type d 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')

# Output markdown table
cat <<EOF
## Villa Repo Metrics

| Metric | Value |
|--------|-------|
| TS files | $ts_files |
| Lines of code | $loc |
| any-types | $any_count |
| Test files | $test_files |
| Dependencies | $deps |
| Packages | $packages |
EOF
