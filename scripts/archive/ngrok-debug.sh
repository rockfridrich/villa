#!/bin/bash
#
# Villa ngrok Diagnostics
# Run this when ngrok isn't working
#

set -euo pipefail

# =============================================================================
# Input Validation (Security)
# =============================================================================

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

# Validate URL format
validate_url() {
  local url="$1"
  if [[ -z "$url" ]]; then
    return 1
  fi
  if [[ ! "$url" =~ ^https?://[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9](/[a-zA-Z0-9._~:/?#\[\]@!\$\&\'()*+,;=-]*)?$ ]]; then
    return 1
  fi
  if [[ ${#url} -gt 2000 ]]; then
    return 1
  fi
  return 0
}

# Validate PID (numeric only)
validate_pid() {
  local pid="$1"
  if [[ ! "$pid" =~ ^[0-9]+$ ]]; then
    return 1
  fi
  return 0
}

# Sanitize string for display (remove control chars, limit length)
sanitize_output() {
  local input="$1"
  local max_len="${2:-200}"
  printf '%s' "$input" | tr -d '\000-\010\013-\037\177' | head -c "$max_len"
}

# Sanitize log line - redact potential secrets
sanitize_log_line() {
  local line="$1"
  # Remove control characters
  line=$(printf '%s' "$line" | tr -d '\000-\010\013-\037\177')
  # Redact common secret patterns
  line=$(printf '%s' "$line" | sed -E 's/(token|key|secret|password|auth)[=:]["'"'"']?[^"'"'"' ]+/\1=[REDACTED]/gi')
  # Limit length
  printf '%s' "$line" | head -c 200
}

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
R='\033[0;31m'
G='\033[0;32m'
Y='\033[0;33m'
C='\033[0;36m'
W='\033[1;37m'
D='\033[0;90m'
N='\033[0m'

# Validate PORT
PORT=${PORT:-3000}
if ! validate_port "$PORT"; then
  echo "Error: Invalid PORT value. Must be 1-65535." >&2
  exit 1
fi

# Log file paths (matching ngrok-share.sh)
LOG_DIR="$PROJECT_ROOT/.logs"
DEV_LOG="$LOG_DIR/villa-dev.log"
NGROK_LOG="$LOG_DIR/villa-ngrok.log"

echo ""
echo -e "${W}Villa${N} ${D}ngrok Diagnostics${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

# Track issues
ISSUES=0
TUNNEL_URL=""

# =============================================================================
# 1. Check if dev server is running
# =============================================================================
echo -e "${C}1. Dev Server${N}"
if lsof -i :"$PORT" > /dev/null 2>&1; then
  echo -e "   ${G}●${N} Running on port $PORT"

  # Check if it responds
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" =~ ^(200|304)$ ]]; then
    echo -e "   ${G}●${N} Responding to requests"
  else
    echo -e "   ${Y}●${N} HTTP status: $(sanitize_output "$HTTP_CODE" 10)"
    if [ "$HTTP_CODE" = "000" ]; then
      echo -e "   ${R}●${N} Server not responding (may be starting)"
      ((ISSUES++)) || true
    fi
  fi
else
  echo -e "   ${R}●${N} NOT running"
  echo -e "   ${D}   Fix: npm run dev${N}"
  ((ISSUES++)) || true
fi
echo ""

# =============================================================================
# 2. Check ngrok process
# =============================================================================
echo -e "${C}2. ngrok Process${N}"
if pgrep -x "ngrok" > /dev/null 2>&1; then
  echo -e "   ${G}●${N} ngrok process running"
  NGROK_PID=$(pgrep -x "ngrok" | head -1)
  if validate_pid "$NGROK_PID"; then
    echo -e "   ${D}   PID: $NGROK_PID${N}"
  fi
else
  echo -e "   ${R}●${N} ngrok NOT running"
  echo -e "   ${D}   Fix: ngrok http $PORT${N}"
  ((ISSUES++)) || true
fi
echo ""

# =============================================================================
# 3. Check ngrok API
# =============================================================================
echo -e "${C}3. ngrok API${N}"
if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
  echo -e "   ${G}●${N} API responding"

  # Get tunnel info using jq (safer than Python)
  TUNNEL_INFO=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null || echo "{}")
  TUNNEL_COUNT=$(echo "$TUNNEL_INFO" | jq -r '.tunnels | length // 0' 2>/dev/null || echo "0")

  if [[ "$TUNNEL_COUNT" =~ ^[0-9]+$ ]] && [ "$TUNNEL_COUNT" -gt 0 ]; then
    echo -e "   ${G}●${N} $TUNNEL_COUNT tunnel(s) active"

    # Get and validate tunnel URL
    RAW_URL=$(echo "$TUNNEL_INFO" | jq -r '.tunnels[0].public_url // empty' 2>/dev/null || echo "")
    if [ -n "$RAW_URL" ] && validate_url "$RAW_URL"; then
      TUNNEL_URL="$RAW_URL"
      echo -e "   ${G}●${N} URL: ${W}$(sanitize_output "$TUNNEL_URL")${N}"
    fi
  else
    echo -e "   ${R}●${N} No active tunnels"
    echo -e "   ${D}   ngrok may have disconnected${N}"
    ((ISSUES++)) || true
  fi
else
  echo -e "   ${R}●${N} API not responding"
  echo -e "   ${D}   ngrok may not be running or crashed${N}"
  ((ISSUES++)) || true
fi
echo ""

# =============================================================================
# 4. Check ngrok auth
# =============================================================================
echo -e "${C}4. ngrok Auth${N}"
if ngrok config check > /dev/null 2>&1; then
  echo -e "   ${G}●${N} Config valid"

  # Check if authtoken is set (don't show the token itself!)
  NGROK_CONFIG_1="$HOME/.config/ngrok/ngrok.yml"
  NGROK_CONFIG_2="$HOME/Library/Application Support/ngrok/ngrok.yml"

  if { [ -f "$NGROK_CONFIG_1" ] && grep -q "authtoken" "$NGROK_CONFIG_1" 2>/dev/null; } || \
     { [ -f "$NGROK_CONFIG_2" ] && grep -q "authtoken" "$NGROK_CONFIG_2" 2>/dev/null; }; then
    echo -e "   ${G}●${N} Auth token configured"
  else
    echo -e "   ${Y}●${N} No auth token (using free tier limits)"
    echo -e "   ${D}   Get token: https://dashboard.ngrok.com/get-started/your-authtoken${N}"
  fi
else
  echo -e "   ${R}●${N} Config invalid"
  echo -e "   ${D}   Fix: ngrok config check${N}"
  ((ISSUES++)) || true
fi
echo ""

# =============================================================================
# 5. Network check
# =============================================================================
echo -e "${C}5. Network${N}"
if curl -s --connect-timeout 3 https://ngrok.com > /dev/null 2>&1; then
  echo -e "   ${G}●${N} Can reach ngrok.com"
else
  echo -e "   ${R}●${N} Cannot reach ngrok.com"
  echo -e "   ${D}   Check internet connection${N}"
  ((ISSUES++)) || true
fi
echo ""

# =============================================================================
# 6. Recent logs (sanitized)
# =============================================================================
echo -e "${C}6. Recent Logs${N}"

show_log_errors() {
  local log_file="$1"
  local log_name="$2"
  local max_lines=3

  if [ -f "$log_file" ]; then
    # Read last 20 lines, filter for errors, sanitize output
    local errors
    errors=$(tail -20 "$log_file" 2>/dev/null | grep -i "error\|failed\|exception" | tail -"$max_lines" || echo "")

    if [ -n "$errors" ]; then
      echo -e "   ${Y}●${N} $log_name errors found:"
      while IFS= read -r line; do
        if [ -n "$line" ]; then
          echo -e "   ${D}   $(sanitize_log_line "$line")${N}"
        fi
      done <<< "$errors"
    else
      echo -e "   ${G}●${N} No recent errors in $log_name"
    fi
  else
    echo -e "   ${D}●${N} No $log_name found"
  fi
}

show_log_errors "$DEV_LOG" "dev log"
show_log_errors "$NGROK_LOG" "ngrok log"

# Also check legacy /tmp locations if .logs doesn't exist
if [ ! -d "$LOG_DIR" ]; then
  if [ -f "/tmp/villa-dev.log" ]; then
    show_log_errors "/tmp/villa-dev.log" "dev log (legacy)"
  fi
  if [ -f "/tmp/villa-ngrok.log" ]; then
    show_log_errors "/tmp/villa-ngrok.log" "ngrok log (legacy)"
  fi
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${D}─────────────────────────────────────────${N}"
if [ "$ISSUES" -eq 0 ]; then
  echo -e "${G}●${N} All checks passed"

  # Show the URL if available
  if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo -e "${W}Your URL:${N} $(sanitize_output "$TUNNEL_URL")"
  fi
else
  echo -e "${R}●${N} Found $ISSUES issue(s)"
  echo ""
  echo -e "${W}Quick fixes:${N}"
  echo -e "  ${D}1.${N} Restart everything:  ${W}npm run dev:share${N}"
  echo -e "  ${D}2.${N} Check ngrok status:  ${W}open http://127.0.0.1:4040${N}"
  echo -e "  ${D}3.${N} View full logs:      ${W}tail -50 $DEV_LOG${N}"
fi
echo ""
