#!/bin/bash
# Setup local.villa.cash in /etc/hosts
# Run with: sudo ./scripts/setup-hosts.sh

set -e

DOMAIN="local.villa.cash"
IP="127.0.0.1"
HOSTS_FILE="/etc/hosts"
MARKER="# Villa local dev"

# Check if already configured
if grep -q "$DOMAIN" "$HOSTS_FILE" 2>/dev/null; then
    echo "✓ $DOMAIN already configured in $HOSTS_FILE"
    exit 0
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "This script needs to modify /etc/hosts"
    echo "Run with: sudo $0"
    exit 1
fi

# Add entry
echo "" >> "$HOSTS_FILE"
echo "$MARKER" >> "$HOSTS_FILE"
echo "$IP $DOMAIN" >> "$HOSTS_FILE"

echo "✓ Added $DOMAIN -> $IP to $HOSTS_FILE"
echo ""
echo "You can now access Villa at: https://local.villa.cash"
