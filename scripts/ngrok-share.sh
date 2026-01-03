#!/bin/bash
#
# Villa Local Share - Mobile QA Testing
# Optimized for Claude Code hot debugging workflow
#

set -e

# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════
PORT=${PORT:-3000}
NGROK_REGION=${NGROK_REGION:-us}

# ═══════════════════════════════════════════════════════════════
# Colors (Claude Code style - minimal, functional)
# ═══════════════════════════════════════════════════════════════
R='\033[0;31m'    # Red - errors
G='\033[0;32m'    # Green - success
Y='\033[0;33m'    # Yellow - warnings/highlights
B='\033[0;34m'    # Blue - info
M='\033[0;35m'    # Magenta - URLs
C='\033[0;36m'    # Cyan - labels
W='\033[1;37m'    # White bold - headers
D='\033[0;90m'    # Dim - secondary text
N='\033[0m'       # Reset

# ═══════════════════════════════════════════════════════════════
# Utility Functions
# ═══════════════════════════════════════════════════════════════
get_local_ip() {
  # Get primary local IP (works on macOS and Linux)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"
  else
    hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1"
  fi
}

check_port() {
  lsof -i :$1 >/dev/null 2>&1
}

wait_for_port() {
  local port=$1
  local timeout=${2:-30}
  local count=0
  while ! check_port $port && [ $count -lt $timeout ]; do
    sleep 1
    ((count++))
  done
  check_port $port
}

# Simple ASCII QR-like display (works everywhere)
print_qr_hint() {
  local url=$1
  echo -e "${D}┌─────────────────────────────────────┐${N}"
  echo -e "${D}│${N} ${C}Scan:${N} ${W}http://127.0.0.1:4040${N}        ${D}│${N}"
  echo -e "${D}│${N} ${D}(ngrok inspector has QR code)${N}      ${D}│${N}"
  echo -e "${D}└─────────────────────────────────────┘${N}"
}

# ═══════════════════════════════════════════════════════════════
# Cleanup
# ═══════════════════════════════════════════════════════════════
cleanup() {
  echo ""
  echo -e "${Y}■${N} Shutting down..."
  kill $DEV_PID 2>/dev/null || true
  pkill -f "ngrok http" 2>/dev/null || true
  echo -e "${G}■${N} Done"
}
trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════
# Kill existing processes
# ═══════════════════════════════════════════════════════════════
pkill -f "next dev" 2>/dev/null || true
pkill -f "ngrok http" 2>/dev/null || true
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
# Start Dev Server
# ═══════════════════════════════════════════════════════════════
echo -e "${Y}■${N} Starting dev server..."
cd "$(dirname "$0")/.."
npm run dev > /tmp/villa-dev.log 2>&1 &
DEV_PID=$!

if wait_for_port $PORT 30; then
  echo -e "${G}■${N} Dev server ready"
else
  echo -e "${R}■${N} Dev server failed - check /tmp/villa-dev.log"
  exit 1
fi

# ═══════════════════════════════════════════════════════════════
# Start ngrok
# ═══════════════════════════════════════════════════════════════
echo -e "${Y}■${N} Starting ngrok tunnel..."
ngrok http $PORT --log=stdout > /tmp/villa-ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to establish tunnel
sleep 3

# Get ngrok URL from API
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'] if d.get('tunnels') else '')" 2>/dev/null || echo "")

if [ -z "$NGROK_URL" ]; then
  echo -e "${R}■${N} ngrok failed to start"
  echo -e "${D}  Check: ngrok config check${N}"
  exit 1
fi

echo -e "${G}■${N} Tunnel established"
echo ""

# ═══════════════════════════════════════════════════════════════
# Connection Info (Claude Code style - compact, scannable)
# ═══════════════════════════════════════════════════════════════
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${C}CONNECTIONS${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""
echo -e "${D}Same Network (faster):${N}"
echo -e "  ${M}http://${LOCAL_IP}:${PORT}${N}"
echo ""
echo -e "${D}Any Network (ngrok):${N}"
echo -e "  ${M}${NGROK_URL}${N}"
echo ""
print_qr_hint "$NGROK_URL"
echo ""

# ═══════════════════════════════════════════════════════════════
# Device Testing Checklist
# ═══════════════════════════════════════════════════════════════
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${C}TESTING CHECKLIST${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""
echo -e "${D}iOS Safari:${N}"
echo -e "  ${D}□${N} Open URL in Safari (not Chrome)"
echo -e "  ${D}□${N} Create Villa ID → Face ID prompt"
echo -e "  ${D}□${N} Sign In → passkey auto-select"
echo ""
echo -e "${D}Android Chrome:${N}"
echo -e "  ${D}□${N} Open URL in Chrome"
echo -e "  ${D}□${N} Create Villa ID → fingerprint prompt"
echo -e "  ${D}□${N} Check cross-device sync"
echo ""

# ═══════════════════════════════════════════════════════════════
# Claude Workflow Commands
# ═══════════════════════════════════════════════════════════════
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${C}CLAUDE WORKFLOW${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""
echo -e "${D}Report issue:${N}"
echo -e "  ${W}\"On [device], [action] shows [problem]\"${N}"
echo ""
echo -e "${D}Quick fixes:${N}"
echo -e "  ${D}•${N} Hot reload: Save file → auto-refresh"
echo -e "  ${D}•${N} Hard refresh: Pull down on mobile"
echo -e "  ${D}•${N} Clear state: Add ?reset to URL"
echo ""

# ═══════════════════════════════════════════════════════════════
# Status Line
# ═══════════════════════════════════════════════════════════════
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${G}●${N} ${D}Ready${N}  ${D}│${N}  ${D}Ctrl+C to stop${N}  ${D}│${N}  ${D}Logs: /tmp/villa-*.log${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Keep alive and show live stats
# ═══════════════════════════════════════════════════════════════
while true; do
  # Check if processes are still running
  if ! kill -0 $DEV_PID 2>/dev/null; then
    echo -e "${R}■${N} Dev server crashed - check /tmp/villa-dev.log"
    exit 1
  fi

  if ! kill -0 $NGROK_PID 2>/dev/null; then
    echo -e "${R}■${N} ngrok disconnected"
    exit 1
  fi

  sleep 5
done
