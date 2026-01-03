#!/bin/bash
#
# Villa ngrok Diagnostics
# Run this when ngrok isn't working
#

# Colors
R='\033[0;31m'
G='\033[0;32m'
Y='\033[0;33m'
C='\033[0;36m'
W='\033[1;37m'
D='\033[0;90m'
N='\033[0m'

PORT=${PORT:-3000}

echo ""
echo -e "${W}Villa${N} ${D}ngrok Diagnostics${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

# Track issues
ISSUES=0

# 1. Check if dev server is running
echo -e "${C}1. Dev Server${N}"
if lsof -i :$PORT > /dev/null 2>&1; then
  echo -e "   ${G}●${N} Running on port $PORT"

  # Check if it responds
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|304"; then
    echo -e "   ${G}●${N} Responding to requests"
  else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT)
    echo -e "   ${Y}●${N} HTTP status: $HTTP_CODE"
    if [ "$HTTP_CODE" = "000" ]; then
      echo -e "   ${R}●${N} Server not responding (may be starting)"
      ((ISSUES++))
    fi
  fi
else
  echo -e "   ${R}●${N} NOT running"
  echo -e "   ${D}   Fix: npm run dev${N}"
  ((ISSUES++))
fi
echo ""

# 2. Check ngrok process
echo -e "${C}2. ngrok Process${N}"
if pgrep -x "ngrok" > /dev/null 2>&1; then
  echo -e "   ${G}●${N} ngrok process running"
  NGROK_PID=$(pgrep -x "ngrok")
  echo -e "   ${D}   PID: $NGROK_PID${N}"
else
  echo -e "   ${R}●${N} ngrok NOT running"
  echo -e "   ${D}   Fix: ngrok http $PORT${N}"
  ((ISSUES++))
fi
echo ""

# 3. Check ngrok API
echo -e "${C}3. ngrok API${N}"
if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
  echo -e "   ${G}●${N} API responding"

  # Get tunnel info
  TUNNEL_INFO=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null)
  TUNNEL_COUNT=$(echo "$TUNNEL_INFO" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('tunnels', [])))" 2>/dev/null || echo "0")

  if [ "$TUNNEL_COUNT" -gt 0 ]; then
    echo -e "   ${G}●${N} $TUNNEL_COUNT tunnel(s) active"

    # Show tunnel URLs
    TUNNEL_URL=$(echo "$TUNNEL_INFO" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'] if d.get('tunnels') else '')" 2>/dev/null)
    if [ -n "$TUNNEL_URL" ]; then
      echo -e "   ${G}●${N} URL: ${W}$TUNNEL_URL${N}"
    fi
  else
    echo -e "   ${R}●${N} No active tunnels"
    echo -e "   ${D}   ngrok may have disconnected${N}"
    ((ISSUES++))
  fi
else
  echo -e "   ${R}●${N} API not responding"
  echo -e "   ${D}   ngrok may not be running or crashed${N}"
  ((ISSUES++))
fi
echo ""

# 4. Check ngrok auth
echo -e "${C}4. ngrok Auth${N}"
if ngrok config check > /dev/null 2>&1; then
  echo -e "   ${G}●${N} Config valid"

  # Check if authtoken is set
  if grep -q "authtoken" ~/.config/ngrok/ngrok.yml 2>/dev/null || grep -q "authtoken" ~/Library/Application\ Support/ngrok/ngrok.yml 2>/dev/null; then
    echo -e "   ${G}●${N} Auth token configured"
  else
    echo -e "   ${Y}●${N} No auth token (using free tier limits)"
    echo -e "   ${D}   Get token: https://dashboard.ngrok.com/get-started/your-authtoken${N}"
  fi
else
  echo -e "   ${R}●${N} Config invalid"
  echo -e "   ${D}   Fix: ngrok config check${N}"
  ((ISSUES++))
fi
echo ""

# 5. Network check
echo -e "${C}5. Network${N}"
if curl -s --connect-timeout 3 https://ngrok.com > /dev/null 2>&1; then
  echo -e "   ${G}●${N} Can reach ngrok.com"
else
  echo -e "   ${R}●${N} Cannot reach ngrok.com"
  echo -e "   ${D}   Check internet connection${N}"
  ((ISSUES++))
fi
echo ""

# 6. Recent logs
echo -e "${C}6. Recent Logs${N}"
if [ -f /tmp/villa-dev.log ]; then
  ERRORS=$(tail -20 /tmp/villa-dev.log | grep -i "error\|failed\|exception" | tail -3)
  if [ -n "$ERRORS" ]; then
    echo -e "   ${Y}●${N} Dev server errors found:"
    echo "$ERRORS" | while read line; do
      echo -e "   ${D}   $line${N}"
    done
  else
    echo -e "   ${G}●${N} No recent errors in dev log"
  fi
else
  echo -e "   ${D}●${N} No dev log found"
fi

if [ -f /tmp/villa-ngrok.log ]; then
  NGROK_ERRORS=$(tail -20 /tmp/villa-ngrok.log | grep -i "error\|failed\|ERR" | tail -3)
  if [ -n "$NGROK_ERRORS" ]; then
    echo -e "   ${Y}●${N} ngrok errors found:"
    echo "$NGROK_ERRORS" | while read line; do
      echo -e "   ${D}   $line${N}"
    done
  else
    echo -e "   ${G}●${N} No recent errors in ngrok log"
  fi
fi
echo ""

# Summary
echo -e "${D}─────────────────────────────────────────${N}"
if [ $ISSUES -eq 0 ]; then
  echo -e "${G}●${N} All checks passed"

  # Show the URL if available
  if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo -e "${W}Your URL:${N} $TUNNEL_URL"
  fi
else
  echo -e "${R}●${N} Found $ISSUES issue(s)"
  echo ""
  echo -e "${W}Quick fixes:${N}"
  echo -e "  ${D}1.${N} Restart everything:  ${W}npm run dev:share${N}"
  echo -e "  ${D}2.${N} Kill and retry:      ${W}pkill ngrok && pkill -f 'next dev'${N}"
  echo -e "  ${D}3.${N} Check ngrok status:  ${W}open http://127.0.0.1:4040${N}"
fi
echo ""
