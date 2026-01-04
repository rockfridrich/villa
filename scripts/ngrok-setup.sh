#!/bin/bash
# ngrok Custom Domain Setup for dev-3.villa.cash
# Configures ngrok with custom domain for local passkey testing

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🚇 ngrok Custom Domain Setup for Villa${NC}"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
  echo -e "${RED}Error: ngrok not installed${NC}"
  echo ""
  echo "Install ngrok:"
  echo "  brew install ngrok  # macOS"
  echo "  # or download from https://ngrok.com/download"
  echo ""
  echo "Then authenticate:"
  echo "  ngrok authtoken YOUR_TOKEN"
  exit 1
fi

# Check if authenticated
if ! ngrok config check &> /dev/null; then
  echo -e "${RED}Error: ngrok not authenticated${NC}"
  echo ""
  echo "Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "Then run: ngrok authtoken YOUR_TOKEN"
  exit 1
fi

echo -e "${GREEN}✓ ngrok installed and authenticated${NC}"

# Domain configuration
CUSTOM_DOMAIN="dev-3.villa.cash"
NGROK_DOMAIN=""

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  ngrok Domain Options${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "For passkey testing, you need HTTPS with a consistent domain."
echo ""
echo "Options:"
echo "  1. Custom domain (requires paid ngrok plan)"
echo "     - Domain: dev-3.villa.cash"
echo "     - Best for: consistent passkey testing"
echo ""
echo "  2. ngrok static domain (free tier)"
echo "     - Domain: your-name.ngrok-free.app"
echo "     - Good for: basic testing"
echo ""

# Check for existing ngrok config
NGROK_CONFIG="$HOME/.config/ngrok/ngrok.yml"
if [ -f "$NGROK_CONFIG" ]; then
  echo -e "${CYAN}Current ngrok config:${NC}"
  cat "$NGROK_CONFIG" | grep -E "domain|authtoken" | head -5 || true
  echo ""
fi

# Check if they have a reserved domain
echo -e "${YELLOW}Checking ngrok domains...${NC}"
DOMAINS=$(ngrok api reserved-domains list 2>/dev/null || echo "")

if echo "$DOMAINS" | grep -q "dev-3.villa.cash"; then
  echo -e "${GREEN}✓ Custom domain dev-3.villa.cash is configured${NC}"
  NGROK_DOMAIN="dev-3.villa.cash"
elif echo "$DOMAINS" | grep -q "ngrok"; then
  STATIC_DOMAIN=$(echo "$DOMAINS" | grep -oE '[a-z0-9-]+\.ngrok-free\.app' | head -1)
  if [ -n "$STATIC_DOMAIN" ]; then
    echo -e "${GREEN}✓ Static domain found: $STATIC_DOMAIN${NC}"
    NGROK_DOMAIN="$STATIC_DOMAIN"
  fi
else
  echo -e "${YELLOW}No reserved domains found${NC}"
  echo ""
  echo "To set up custom domain (paid plan):"
  echo "  1. Go to https://dashboard.ngrok.com/cloud-edge/domains"
  echo "  2. Add domain: dev-3.villa.cash"
  echo "  3. Note the CNAME target (e.g., xxx.ngrok-dns.com)"
  echo "  4. Add CNAME in CloudFlare: dev-3 → xxx.ngrok-dns.com (DNS only)"
  echo ""
  echo "To set up static domain (free plan):"
  echo "  1. Go to https://dashboard.ngrok.com/cloud-edge/domains"
  echo "  2. Create a static domain"
  echo "  3. Use that domain for testing"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Create/update ngrok config for villa
VILLA_NGROK_CONFIG="/Users/me/Documents/Coding/villa/.ngrok.yml"

if [ -n "$NGROK_DOMAIN" ]; then
  cat > "$VILLA_NGROK_CONFIG" << EOF
# Villa ngrok configuration
# Start tunnel: ngrok start villa --config .ngrok.yml

version: "2"
tunnels:
  villa:
    proto: http
    addr: 3000
    domain: $NGROK_DOMAIN
    inspect: true
EOF
  echo -e "${GREEN}✓ Created .ngrok.yml with domain: $NGROK_DOMAIN${NC}"
else
  cat > "$VILLA_NGROK_CONFIG" << EOF
# Villa ngrok configuration
# Start tunnel: ngrok http 3000 --config .ngrok.yml

version: "2"
tunnels:
  villa:
    proto: http
    addr: 3000
    inspect: true
    # Add domain here after setting up:
    # domain: dev-3.villa.cash
EOF
  echo -e "${YELLOW}Created .ngrok.yml (no domain configured yet)${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Usage${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Start development with ngrok tunnel:"
echo ""
echo "  ${CYAN}npm run dev:share${NC}"
echo ""
echo "Or manually:"
echo ""
echo "  ${CYAN}npm run dev &${NC}"
echo "  ${CYAN}ngrok start villa --config .ngrok.yml${NC}"
echo ""

if [ -n "$NGROK_DOMAIN" ]; then
  echo "Your tunnel URL: ${GREEN}https://$NGROK_DOMAIN${NC}"
else
  echo "Your tunnel URL will be shown when ngrok starts"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  CloudFlare DNS Setup (Custom Domain)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "If using custom domain (dev-3.villa.cash):"
echo ""
echo "1. Get ngrok CNAME target from dashboard"
echo "2. Add DNS record in CloudFlare:"
echo ""
echo "   Type: CNAME"
echo "   Name: dev-3"
echo "   Target: [your-ngrok-cname-target]"
echo "   Proxy: OFF (grey cloud - DNS only)"
echo ""
echo "   ${YELLOW}Important: Proxy must be OFF for ngrok${NC}"
echo ""
echo "Or use the SDK:"
echo ""
echo "   ${CYAN}npm run infra cloudflare dns upsert dev-3 YOUR_NGROK_TARGET --no-proxy${NC}"
echo ""
