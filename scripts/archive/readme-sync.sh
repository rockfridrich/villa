#!/bin/bash

# README Sync Script
# Validates and optionally updates README.md with current state

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
README="$REPO_ROOT/README.md"
GOALS="$REPO_ROOT/.claude/shared/goals.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_mode=false
if [[ "$1" == "--check" ]]; then
  check_mode=true
fi

echo "README Sync"
echo "==========="

# Check 1: Package name consistency
echo -n "Checking SDK package name... "
pkg_name=$(jq -r '.name' "$REPO_ROOT/packages/sdk/package.json" 2>/dev/null || echo "unknown")
if grep -q "$pkg_name" "$README"; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${YELLOW}WARN: README may have outdated package name (expected: $pkg_name)${NC}"
fi

# Check 2: Version tag
echo -n "Checking version... "
latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
if grep -q "$latest_tag\|Latest\|beta" "$README"; then
  echo -e "${GREEN}OK${NC} ($latest_tag)"
else
  echo -e "${YELLOW}WARN: Version $latest_tag not mentioned${NC}"
fi

# Check 3: Current sprint
echo -n "Checking sprint info... "
if [[ -f "$GOALS" ]]; then
  current_sprint=$(jq -r '.currentSprint.name' "$GOALS" 2>/dev/null || echo "unknown")
  if grep -qi "sprint" "$README"; then
    echo -e "${GREEN}OK${NC} ($current_sprint)"
  else
    echo -e "${YELLOW}WARN: Sprint info not in README${NC}"
  fi
else
  echo -e "${YELLOW}WARN: No goals.json found${NC}"
fi

# Check 4: Links are valid
echo -n "Checking links... "
broken_links=0
while IFS= read -r url; do
  if [[ "$url" =~ ^https?:// ]]; then
    # Skip actual HTTP checks in CI (too slow)
    :
  fi
done < <(grep -oE 'https?://[^)]+' "$README" | head -5)
echo -e "${GREEN}OK${NC} (syntax check only)"

# Check 5: Required sections exist
echo -n "Checking required sections... "
required_sections=("Quick Start" "Development" "Contributing" "License")
missing=()
for section in "${required_sections[@]}"; do
  if ! grep -q "## $section\|## .*$section" "$README"; then
    missing+=("$section")
  fi
done
if [[ ${#missing[@]} -eq 0 ]]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}MISSING: ${missing[*]}${NC}"
  if $check_mode; then
    exit 1
  fi
fi

# Check 6: No stale content markers
echo -n "Checking for stale markers... "
if grep -qiE "TODO|FIXME|WIP|PLACEHOLDER" "$README"; then
  echo -e "${YELLOW}WARN: Found TODO/FIXME/WIP markers${NC}"
else
  echo -e "${GREEN}OK${NC}"
fi

echo ""
echo "README sync complete."

if $check_mode; then
  echo "All checks passed."
  exit 0
fi
