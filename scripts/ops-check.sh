#!/usr/bin/env bash
set -euo pipefail

# Get script directory and repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if jq is available
HAS_JQ=false
if command -v jq &> /dev/null; then
  HAS_JQ=true
fi

# Format uptime from seconds to human readable
format_uptime() {
  local seconds=$1
  if (( seconds < 60 )); then
    echo "${seconds}s"
  elif (( seconds < 3600 )); then
    echo "$((seconds / 60))m"
  elif (( seconds < 86400 )); then
    echo "$((seconds / 3600))h"
  else
    echo "$((seconds / 86400))d"
  fi
}

# Check a service health endpoint
check_service() {
  local name=$1
  local url=$2
  local label=$3

  local response
  local http_code

  response=$(curl -s --max-time 3 -w "\n%{http_code}" "$url" 2>/dev/null || echo "")
  http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [[ "$http_code" == "200" ]]; then
    local status="unknown"
    local uptime=""
    local build=""

    if [[ "$HAS_JQ" == "true" ]] && [[ -n "$body" ]]; then
      status=$(echo "$body" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

      # Try to get uptime
      local uptime_seconds=$(echo "$body" | jq -r '.uptime // empty' 2>/dev/null || echo "")
      if [[ -n "$uptime_seconds" ]] && [[ "$uptime_seconds" != "null" ]]; then
        uptime=$(format_uptime "$uptime_seconds")
      fi

      # Try to get build hash (try both buildHash and sha fields)
      build=$(echo "$body" | jq -r '.buildHash // .sha // empty' 2>/dev/null | head -c 7 || echo "")

      # Special handling for DB health check
      if [[ "$name" == "db" ]]; then
        local latency=$(echo "$body" | jq -r '.latency // empty' 2>/dev/null || echo "")
        if [[ -n "$latency" ]] && [[ "$latency" != "null" ]]; then
          uptime="latency:${latency}ms"
        fi
      fi
    fi

    if [[ "$status" == "ok" ]] || [[ "$http_code" == "200" ]]; then
      local info=""
      [[ -n "$uptime" ]] && info="up ${uptime}"
      [[ -n "$build" ]] && info="${info:+$info  }build:${build}"
      printf "%-5s %-30s ${GREEN}✅${NC} %s\n" "$name" "($label)" "$info"
    else
      printf "%-5s %-30s ${YELLOW}⚠${NC}  status:%s\n" "$name" "($label)" "$status"
    fi
  else
    printf "%-5s %-30s ${RED}❌${NC} failed (HTTP %s)\n" "$name" "($label)" "${http_code:-timeout}"
  fi
}

# Check CI status using gh
check_ci() {
  if ! command -v gh &> /dev/null; then
    return
  fi

  local run_info
  run_info=$(gh run list --repo rockfridrich/villa --branch main --limit 1 --json status,conclusion,name,createdAt 2>/dev/null || echo "")

  if [[ -z "$run_info" ]] || [[ "$run_info" == "[]" ]]; then
    return
  fi

  if [[ "$HAS_JQ" == "true" ]]; then
    local status=$(echo "$run_info" | jq -r '.[0].status // "unknown"')
    local conclusion=$(echo "$run_info" | jq -r '.[0].conclusion // "unknown"')
    local created_at=$(echo "$run_info" | jq -r '.[0].createdAt // ""')

    local time_ago=""
    if [[ -n "$created_at" ]]; then
      local created_timestamp=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$created_at" "+%s" 2>/dev/null || echo "")
      if [[ -n "$created_timestamp" ]]; then
        local now=$(date +%s)
        local diff=$((now - created_timestamp))
        time_ago=$(format_uptime "$diff")
      fi
    fi

    if [[ "$conclusion" == "success" ]]; then
      printf "%-5s %-30s ${GREEN}✅${NC} passed${time_ago:+ ${time_ago} ago}\n" "CI" "main"
    elif [[ "$conclusion" == "failure" ]]; then
      printf "%-5s %-30s ${RED}❌${NC} failed${time_ago:+ ${time_ago} ago}\n" "CI" "main"
    elif [[ "$status" == "in_progress" ]]; then
      printf "%-5s %-30s ${YELLOW}⏳${NC} running${time_ago:+ ${time_ago} ago}\n" "CI" "main"
    else
      printf "%-5s %-30s ${YELLOW}⚠${NC}  %s\n" "CI" "main" "$conclusion"
    fi
  fi
}

# Main execution
echo "Villa Service Status"
echo "─────────────────────────────────────────────"

check_service "hub"  "https://villa.cash/api/health" "villa.cash"
check_service "hub"  "https://construction.villa.cash/api/health" "construction.villa.cash"
check_service "key"  "https://key.villa.cash/api/health" "key.villa.cash"
check_service "key"  "https://fake-key.villa.cash/api/health" "fake-key.villa.cash"
check_service "docs" "https://docs.villa.cash/api/health" "docs.villa.cash"
check_service "db"   "https://villa.cash/api/health/db" "postgres"

echo "─────────────────────────────────────────────"

check_ci
