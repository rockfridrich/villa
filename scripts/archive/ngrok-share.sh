#!/bin/bash
#
# Villa Local Share - Mobile QA Testing
# Optimized for Claude Code hot debugging workflow
#

set -e

# ═══════════════════════════════════════════════════════════════
# Input Validation (Security)
# ═══════════════════════════════════════════════════════════════

# Validate port number (1-65535)
validate_port() {
  local port="$1"
  if [[ ! "$port" =~ ^[0-9]+$ ]]; then
    return 1
  fi
  if [[ "$port" -lt 1 || "$port" -gt 65535 ]]; then
    return 1
  fi
  return 0
}

# Validate domain name
validate_domain() {
  local domain="$1"
  if [[ -z "$domain" ]]; then
    return 0  # Empty is OK (optional)
  fi
  # Domain: alphanumeric, dash, dot only; max 253 chars
  if [[ ! "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ ]]; then
    return 1
  fi
  if [[ ${#domain} -gt 253 ]]; then
    return 1
  fi
  return 0
}

# Validate URL format
validate_url() {
  local url="$1"
  if [[ -z "$url" ]]; then
    return 1
  fi
  # Must start with http:// or https://, followed by valid domain/path
  if [[ ! "$url" =~ ^https?://[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9](/[a-zA-Z0-9._~:/?#\[\]@!\$\&\'()*+,;=-]*)?$ ]]; then
    return 1
  fi
  if [[ ${#url} -gt 2000 ]]; then
    return 1
  fi
  return 0
}

# Sanitize string for display (remove control characters)
sanitize_output() {
  local input="$1"
  printf '%s' "$input" | tr -d '\000-\010\013-\037\177' | head -c 500
}

# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════
PORT=${PORT:-3000}

# Validate PORT
if ! validate_port "$PORT"; then
  echo "Error: Invalid PORT value. Must be 1-65535." >&2
  exit 1
fi

HEALTH_ENDPOINT="http://localhost:$PORT/api/health"
MAX_RETRIES=3
RETRY_DELAY=2

# ═══════════════════════════════════════════════════════════════
# Colors (Claude Code style - minimal, functional)
# ═══════════════════════════════════════════════════════════════
R='\033[0;31m'
G='\033[0;32m'
Y='\033[0;33m'
B='\033[0;34m'
M='\033[0;35m'
C='\033[0;36m'
W='\033[1;37m'
D='\033[0;90m'
N='\033[0m'

# ═══════════════════════════════════════════════════════════════
# Utility Functions
# ═══════════════════════════════════════════════════════════════
get_local_ip() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"
  else
    hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1"
  fi
}

check_health() {
  curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null | grep -q "200"
}

wait_for_health() {
  local timeout=${1:-30}
  local count=0
  while ! check_health && [ $count -lt $timeout ]; do
    sleep 1
    ((count++))
  done
  check_health
}

get_ngrok_url() {
  local raw_url
  # Use jq instead of Python for safer JSON parsing
  raw_url=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | \
    jq -r '.tunnels[0].public_url // empty' 2>/dev/null || echo "")

  # Validate URL before returning
  if [ -n "$raw_url" ] && validate_url "$raw_url"; then
    echo "$raw_url"
  else
    echo ""
  fi
}

# ═══════════════════════════════════════════════════════════════
# PID Tracking (project-specific, avoids killing unrelated processes)
# ═══════════════════════════════════════════════════════════════
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.villa-share.pid"

# Kill a specific PID if it belongs to expected process
safe_kill_pid() {
  local pid="$1"
  local expected_pattern="$2"

  if [[ ! "$pid" =~ ^[0-9]+$ ]]; then
    return 0
  fi

  # Verify PID is numeric and process exists
  if kill -0 "$pid" 2>/dev/null; then
    # Check if process command matches expected pattern
    local cmd
    cmd=$(ps -p "$pid" -o command= 2>/dev/null || echo "")
    if [[ "$cmd" == *"$expected_pattern"* ]]; then
      kill "$pid" 2>/dev/null || true
    fi
  fi
}

# Save PIDs to file for cleanup
save_pids() {
  printf '%s\n%s\n' "${DEV_PID:-}" "${NGROK_PID:-}" > "$PID_FILE"
}

# Load and kill previous PIDs if they exist
kill_previous_session() {
  if [ -f "$PID_FILE" ]; then
    local old_dev_pid old_ngrok_pid
    { read -r old_dev_pid; read -r old_ngrok_pid; } < "$PID_FILE" 2>/dev/null || true

    # Only kill if PID is valid and matches expected process
    [ -n "$old_dev_pid" ] && safe_kill_pid "$old_dev_pid" "next"
    [ -n "$old_ngrok_pid" ] && safe_kill_pid "$old_ngrok_pid" "ngrok"

    rm -f "$PID_FILE"
  fi
}

# ═══════════════════════════════════════════════════════════════
# Cleanup
# ═══════════════════════════════════════════════════════════════
cleanup() {
  echo ""
  echo -e "${Y}■${N} Shutting down..."
  # Only kill our specific PIDs, not all matching processes
  [ -n "$DEV_PID" ] && safe_kill_pid "$DEV_PID" "next"
  [ -n "$NGROK_PID" ] && safe_kill_pid "$NGROK_PID" "ngrok"
  rm -f "$PID_FILE"
  echo -e "${G}■${N} Done"
}
trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════
# Kill previous session (project-specific only)
# ═══════════════════════════════════════════════════════════════
kill_previous_session
sleep 1

# ═══════════════════════════════════════════════════════════════
# Header
# ═══════════════════════════════════════════════════════════════
clear
LOCAL_IP=$(get_local_ip)

echo ""
echo -e "${W}Villa${N} ${D}Local Share${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Log Files (project-specific, not world-writable /tmp)
# ═══════════════════════════════════════════════════════════════
LOG_DIR="$PROJECT_ROOT/.logs"
mkdir -p "$LOG_DIR"
DEV_LOG="$LOG_DIR/villa-dev.log"
NGROK_LOG="$LOG_DIR/villa-ngrok.log"

# ═══════════════════════════════════════════════════════════════
# Start Dev Server
# ═══════════════════════════════════════════════════════════════
echo -e "${Y}■${N} Starting dev server..."
cd "$PROJECT_ROOT"
npm run dev > "$DEV_LOG" 2>&1 &
DEV_PID=$!

echo -ne "${D}   Waiting for health check"
if wait_for_health 45; then
  echo -e "${N}"
  echo -e "${G}■${N} Dev server healthy"
else
  echo -e "${N}"
  echo -e "${R}■${N} Dev server failed to start"
  echo ""
  echo -e "${W}Troubleshooting:${N}"
  echo -e "  ${D}1.${N} Check logs: ${W}tail -50 $DEV_LOG${N}"
  echo -e "  ${D}2.${N} Run diagnostics: ${W}./scripts/ngrok-debug.sh${N}"
  echo -e "  ${D}3.${N} Clear cache: ${W}npm run dev:clean${N}"
  echo ""
  exit 1
fi

# ═══════════════════════════════════════════════════════════════
# Start ngrok with retry
# ═══════════════════════════════════════════════════════════════
echo -e "${Y}■${N} Starting ngrok tunnel..."

# Validate and use custom domain if configured (paid ngrok feature)
NGROK_DOMAIN="${NGROK_DOMAIN:-}"
NGROK_ARGS=("http" "$PORT" "--log=stdout")

if [ -n "$NGROK_DOMAIN" ]; then
  if validate_domain "$NGROK_DOMAIN"; then
    NGROK_ARGS+=("--domain=$NGROK_DOMAIN")
    echo -e "${D}Using custom domain: $(sanitize_output "$NGROK_DOMAIN")${N}"
  else
    echo -e "${R}■${N} Invalid NGROK_DOMAIN format, ignoring"
    echo -e "${D}Using random ngrok URL instead${N}"
  fi
else
  echo -e "${D}Using random ngrok URL (set NGROK_DOMAIN=dev-3.villa.cash for custom)${N}"
fi

for ((i=1; i<=MAX_RETRIES; i++)); do
  # Use array expansion for safe command execution
  ngrok "${NGROK_ARGS[@]}" > "$NGROK_LOG" 2>&1 &
  NGROK_PID=$!

  # Save PIDs for cleanup on restart
  save_pids

  sleep 4

  NGROK_URL=$(get_ngrok_url)
  if [ -n "$NGROK_URL" ]; then
    echo -e "${G}■${N} Tunnel established"
    break
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    echo -e "${Y}■${N} Retry $i/$MAX_RETRIES..."
    safe_kill_pid "$NGROK_PID" "ngrok"
    sleep $RETRY_DELAY
  else
    echo -e "${R}■${N} ngrok failed after $MAX_RETRIES attempts"
    echo ""
    echo -e "${W}Troubleshooting:${N}"
    echo -e "  ${D}1.${N} Check ngrok auth: ${W}ngrok config check${N}"
    echo -e "  ${D}2.${N} Check logs: ${W}tail -20 $NGROK_LOG${N}"
    echo -e "  ${D}3.${N} Run diagnostics: ${W}./scripts/ngrok-debug.sh${N}"
    echo -e "  ${D}4.${N} Get auth token: ${W}https://dashboard.ngrok.com/get-started/your-authtoken${N}"
    echo ""
    exit 1
  fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# Connection Info
# ═══════════════════════════════════════════════════════════════
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${C}CONNECTIONS${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""
echo -e "${D}Same Network (faster, no passkeys):${N}"
echo -e "  ${M}http://${LOCAL_IP}:${PORT}${N}"
echo ""
echo -e "${D}Any Network (passkeys work):${N}"
echo -e "  ${M}${NGROK_URL}${N}"
echo ""

# ═══════════════════════════════════════════════════════════════
# QR Codes (if qrencode available)
# ═══════════════════════════════════════════════════════════════
if command -v qrencode &> /dev/null; then
  echo -e "${D}─────────────────────────────────────────${N}"
  echo -e "${C}QR CODES${N} ${D}(scan with phone camera)${N}"
  echo -e "${D}─────────────────────────────────────────${N}"
  echo ""
  echo -e "${W}Local WiFi${N} ${D}(same network only)${N}"
  qrencode -t ANSIUTF8 -m 1 "http://${LOCAL_IP}:${PORT}" 2>/dev/null
  echo ""
  echo -e "${W}ngrok${N} ${D}(any network, passkeys work)${N}"
  qrencode -t ANSIUTF8 -m 1 "${NGROK_URL}" 2>/dev/null
  echo ""
else
  echo -e "${D}Tip: Install qrencode for QR codes: brew install qrencode${N}"
  echo ""
fi

# ═══════════════════════════════════════════════════════════════
# Quick Reference
# ═══════════════════════════════════════════════════════════════
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${C}QUICK REFERENCE${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""
echo -e "${D}Test passkeys:${N}     Use ngrok URL (HTTPS required)"
echo -e "${D}Test UI only:${N}      Use local IP (faster)"
echo -e "${D}Report issues:${N}     \"On [device], [action] → [problem]\""
echo -e "${D}Refresh:${N}           Pull down on mobile"
echo -e "${D}Clear state:${N}       Add ?reset to URL"
echo ""
echo -e "${D}Diagnostics:${N}       ${W}./scripts/ngrok-debug.sh${N}"
echo -e "${D}ngrok dashboard:${N}   ${W}open http://127.0.0.1:4040${N}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Status Line
# ═══════════════════════════════════════════════════════════════
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${G}●${N} ${D}Ready${N}  ${D}│${N}  ${D}Ctrl+C to stop${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Keep alive with health monitoring
# ═══════════════════════════════════════════════════════════════
FAIL_COUNT=0
MAX_FAILS=3

while true; do
  sleep 10

  # Check dev server health
  if ! check_health; then
    ((FAIL_COUNT++))
    if [ $FAIL_COUNT -ge $MAX_FAILS ]; then
      echo -e "${R}■${N} Dev server stopped responding"
      echo -e "${D}   Check: tail -50 /tmp/villa-dev.log${N}"
      exit 1
    fi
  else
    FAIL_COUNT=0
  fi

  # Check ngrok
  if ! kill -0 $NGROK_PID 2>/dev/null; then
    echo -e "${R}■${N} ngrok disconnected"
    echo -e "${D}   Restart with: npm run dev:share${N}"
    exit 1
  fi

  # Check if tunnel still exists
  if [ -z "$(get_ngrok_url)" ]; then
    echo -e "${Y}■${N} Tunnel lost, checking..."
    sleep 3
    if [ -z "$(get_ngrok_url)" ]; then
      echo -e "${R}■${N} ngrok tunnel closed"
      echo -e "${D}   Free tier tunnels expire after ~2 hours${N}"
      echo -e "${D}   Restart with: npm run dev:share${N}"
      exit 1
    fi
  fi
done
