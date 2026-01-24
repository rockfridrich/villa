#!/bin/bash
#
# Villa QA Session Start
# Sets up environment for mobile testing with Claude
#

set -e

# Colors
G='\033[0;32m'
Y='\033[0;33m'
C='\033[0;36m'
W='\033[1;37m'
D='\033[0;90m'
N='\033[0m'

cd "$(dirname "$0")/.."

clear
echo ""
echo -e "${W}Villa${N} ${D}QA Session${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

# Check git status
BRANCH=$(git branch --show-current)
CHANGES=$(git status --porcelain | wc -l | tr -d ' ')

echo -e "${C}GIT STATUS${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "  Branch:  ${W}${BRANCH}${N}"
echo -e "  Changes: ${CHANGES} files"
echo ""

# Show last commit
LAST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null || echo "No commits")
echo -e "  Last:    ${D}${LAST_COMMIT}${N}"
echo ""

# Run typecheck
echo -e "${Y}■${N} Running typecheck..."
if npm run typecheck --silent 2>/dev/null; then
  echo -e "${G}■${N} TypeScript OK"
else
  echo -e "${Y}■${N} TypeScript has issues (check before testing)"
fi
echo ""

# Start sharing
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${C}STARTING SHARE${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

exec ./scripts/ngrok-share.sh
