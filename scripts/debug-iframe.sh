#!/bin/bash
# Debug iframe authentication flow
# Usage: ./scripts/debug-iframe.sh [url]
#
# Checks:
# - CSP headers for frame-ancestors
# - CORS headers
# - Health endpoint
# - Auth page accessibility

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="${1:-https://beta.villa.cash}"

echo -e "${BLUE}=== Villa Iframe Debug ===${NC}"
echo "Target: $BASE_URL"
echo ""

# 1. Health check
echo -e "${YELLOW}1. Health Check${NC}"
HEALTH=$(curl -s "$BASE_URL/api/health" 2>/dev/null || echo '{"error": "failed"}')
if echo "$HEALTH" | grep -q "timestamp"; then
    TIMESTAMP=$(echo "$HEALTH" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}[OK]${NC} Health: $TIMESTAMP"
else
    echo -e "${RED}[FAIL]${NC} Health check failed"
    echo "$HEALTH"
fi
echo ""

# 2. CSP Headers
echo -e "${YELLOW}2. CSP Headers${NC}"
CSP=$(curl -sI "$BASE_URL/auth" 2>/dev/null | grep -i "content-security-policy" || echo "")
if [ -n "$CSP" ]; then
    echo -e "${BLUE}[INFO]${NC} CSP header found:"
    echo "$CSP" | head -1
    
    # Check frame-ancestors
    if echo "$CSP" | grep -qi "frame-ancestors"; then
        echo -e "${GREEN}[OK]${NC} frame-ancestors directive present"
    else
        echo -e "${YELLOW}[WARN]${NC} No frame-ancestors directive"
    fi
else
    echo -e "${YELLOW}[WARN]${NC} No CSP header found"
fi
echo ""

# 3. CORS Headers
echo -e "${YELLOW}3. CORS Headers${NC}"
CORS=$(curl -sI "$BASE_URL/auth" 2>/dev/null | grep -i "access-control" || echo "")
if [ -n "$CORS" ]; then
    echo -e "${BLUE}[INFO]${NC} CORS headers:"
    echo "$CORS"
else
    echo -e "${YELLOW}[INFO]${NC} No CORS headers (may be OK for same-origin)"
fi
echo ""

# 4. Auth page accessibility
echo -e "${YELLOW}4. Auth Page${NC}"
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth" 2>/dev/null || echo "000")
if [ "$AUTH_STATUS" = "200" ]; then
    echo -e "${GREEN}[OK]${NC} /auth returns 200"
elif [ "$AUTH_STATUS" = "307" ] || [ "$AUTH_STATUS" = "302" ]; then
    echo -e "${YELLOW}[WARN]${NC} /auth redirects ($AUTH_STATUS)"
else
    echo -e "${RED}[FAIL]${NC} /auth returns $AUTH_STATUS"
fi
echo ""

# 5. X-Frame-Options
echo -e "${YELLOW}5. X-Frame-Options${NC}"
XFO=$(curl -sI "$BASE_URL/auth" 2>/dev/null | grep -i "x-frame-options" || echo "")
if [ -n "$XFO" ]; then
    if echo "$XFO" | grep -qi "DENY"; then
        echo -e "${RED}[FAIL]${NC} X-Frame-Options: DENY - iframe blocked!"
    elif echo "$XFO" | grep -qi "SAMEORIGIN"; then
        echo -e "${YELLOW}[WARN]${NC} X-Frame-Options: SAMEORIGIN - only same-origin iframe"
    else
        echo -e "${BLUE}[INFO]${NC} $XFO"
    fi
else
    echo -e "${GREEN}[OK]${NC} No X-Frame-Options (iframe allowed)"
fi
echo ""

# 6. Test key.villa.cash specifically
if [ "$BASE_URL" != "https://key.villa.cash" ]; then
    echo -e "${YELLOW}6. key.villa.cash Check${NC}"
    KEY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://key.villa.cash/auth" 2>/dev/null || echo "000")
    if [ "$KEY_STATUS" = "200" ]; then
        echo -e "${GREEN}[OK]${NC} key.villa.cash/auth accessible"
    else
        echo -e "${RED}[FAIL]${NC} key.villa.cash/auth returns $KEY_STATUS"
    fi
fi

echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo "If iframe is not working, check:"
echo "  1. CSP frame-ancestors must allow parent origin"
echo "  2. X-Frame-Options must not be DENY"
echo "  3. CORS may be needed for cross-origin postMessage"
echo ""
echo "Local debug: pnpm dev:local (HTTPS required for passkeys)"
