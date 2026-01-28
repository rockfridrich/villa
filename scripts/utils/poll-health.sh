#!/usr/bin/env bash
set -e

poll_health() {
  local url=$1
  local timeout=${2:-300}
  local service_name=${3:-"Service"}
  local elapsed=0
  local wait_time=5

  echo "⏳ Polling $service_name health at $url"
  echo "   Timeout: ${timeout}s, Initial wait: ${wait_time}s"

  while [ $elapsed -lt $timeout ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      echo "✅ $service_name healthy after ${elapsed}s"
      return 0
    fi

    echo "⏳ $service_name not ready... (${elapsed}/${timeout}s, next check in ${wait_time}s)"
    sleep $wait_time
    elapsed=$((elapsed + wait_time))

    if [ $wait_time -lt 30 ]; then
      wait_time=$((wait_time + 5))
    fi
  done

  echo "❌ $service_name failed to become healthy within ${timeout}s"
  return 1
}

if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  if [ $# -lt 1 ]; then
    echo "Usage: $0 <url> [timeout_seconds] [service_name]"
    echo ""
    echo "Examples:"
    echo "  $0 https://villa.cash/api/health 300 'Villa Hub'"
    echo "  $0 https://docs.villa.cash/api/health 180 'Villa Docs'"
    exit 1
  fi
  
  poll_health "$1" "$2" "$3"
fi