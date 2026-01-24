#!/bin/bash
# Add DNS record to CloudFlare for Villa
# Usage: ./scripts/dns-add-record.sh <name> <target> [--no-proxy]
#
# Example:
#   ./scripts/dns-add-record.sh beta-key villa-staging-25mrj.ondigitalocean.app

set -e

NAME="${1:-}"
TARGET="${2:-}"
PROXY="${3:-}"

if [ -z "$NAME" ] || [ -z "$TARGET" ]; then
  echo "Usage: $0 <name> <target> [--no-proxy]"
  echo ""
  echo "Examples:"
  echo "  $0 beta-key villa-staging-25mrj.ondigitalocean.app"
  echo "  $0 dev-3 xxxxx.ngrok-free.app --no-proxy"
  exit 1
fi

# Check for token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "CLOUDFLARE_API_TOKEN not set."
  echo ""
  echo "Get a token from: https://dash.cloudflare.com/profile/api-tokens"
  echo "Required permissions: Zone → DNS → Edit"
  echo ""
  read -sp "Enter CloudFlare API Token: " CLOUDFLARE_API_TOKEN
  echo ""
fi

# Check for zone ID
if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "CLOUDFLARE_ZONE_ID not set."
  echo ""
  echo "Find it in CloudFlare Dashboard → villa.cash → Overview → Zone ID"
  echo ""
  read -p "Enter Zone ID: " CLOUDFLARE_ZONE_ID
fi

# Verify token
echo "Verifying token..."
VERIFY=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

if echo "$VERIFY" | grep -q '"success":true'; then
  echo "✓ Token valid"
else
  echo "✗ Token invalid or expired"
  echo "$VERIFY" | jq '.errors' 2>/dev/null || echo "$VERIFY"
  exit 1
fi

# Determine proxy setting
PROXIED="true"
if [ "$PROXY" = "--no-proxy" ]; then
  PROXIED="false"
fi

FULL_NAME="${NAME}.villa.cash"

# Check if record exists
echo "Checking for existing record..."
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${FULL_NAME}" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

RECORD_ID=$(echo "$EXISTING" | jq -r '.result[0].id // empty')

if [ -n "$RECORD_ID" ]; then
  echo "Record exists (ID: $RECORD_ID), updating..."
  RESULT=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${RECORD_ID}" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"${FULL_NAME}\",\"content\":\"${TARGET}\",\"proxied\":${PROXIED}}")
else
  echo "Creating new record..."
  RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"${FULL_NAME}\",\"content\":\"${TARGET}\",\"proxied\":${PROXIED},\"ttl\":1}")
fi

if echo "$RESULT" | grep -q '"success":true'; then
  echo ""
  echo "✓ DNS record configured successfully!"
  echo ""
  echo "  Type:    CNAME"
  echo "  Name:    ${FULL_NAME}"
  echo "  Target:  ${TARGET}"
  echo "  Proxied: ${PROXIED}"
  echo ""
  echo "DNS propagation may take a few minutes."
  echo "Verify with: dig ${FULL_NAME} +short"
else
  echo ""
  echo "✗ Failed to configure DNS record"
  echo "$RESULT" | jq '.errors' 2>/dev/null || echo "$RESULT"
  exit 1
fi
