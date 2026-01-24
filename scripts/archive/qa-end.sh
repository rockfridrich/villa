#!/bin/bash
#
# Villa QA Session End
# Wraps up session, shows summary, prompts for commit
#

set -e

# Colors
G='\033[0;32m'
Y='\033[0;33m'
R='\033[0;31m'
C='\033[0;36m'
W='\033[1;37m'
D='\033[0;90m'
N='\033[0m'

cd "$(dirname "$0")/.."

# Kill running processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "ngrok http" 2>/dev/null || true

clear
echo ""
echo -e "${W}Villa${N} ${D}QA Session Summary${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

# Show changes made
CHANGES=$(git status --porcelain)
CHANGED_FILES=$(echo "$CHANGES" | wc -l | tr -d ' ')

if [ -z "$CHANGES" ]; then
  echo -e "${D}No changes made this session${N}"
  echo ""
  exit 0
fi

echo -e "${C}CHANGES (${CHANGED_FILES} files)${N}"
echo -e "${D}─────────────────────────────────────────${N}"

# Group by type
MODIFIED=$(echo "$CHANGES" | grep "^ M" | wc -l | tr -d ' ')
ADDED=$(echo "$CHANGES" | grep "^??" | wc -l | tr -d ' ')
DELETED=$(echo "$CHANGES" | grep "^ D" | wc -l | tr -d ' ')

[ "$MODIFIED" -gt 0 ] && echo -e "  ${Y}Modified:${N} $MODIFIED"
[ "$ADDED" -gt 0 ] && echo -e "  ${G}Added:${N}    $ADDED"
[ "$DELETED" -gt 0 ] && echo -e "  ${R}Deleted:${N}  $DELETED"
echo ""

# Show changed files
echo -e "${D}Files:${N}"
echo "$CHANGES" | head -10 | while read line; do
  echo -e "  ${D}${line}${N}"
done
[ "$CHANGED_FILES" -gt 10 ] && echo -e "  ${D}... and $((CHANGED_FILES - 10)) more${N}"
echo ""

# Run quick checks
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${C}QUICK CHECKS${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""

echo -e "${Y}■${N} TypeScript..."
if npm run typecheck --silent 2>/dev/null; then
  echo -e "${G}■${N} TypeScript OK"
else
  echo -e "${R}■${N} TypeScript errors - fix before commit"
fi

echo -e "${Y}■${N} Lint..."
if npm run lint --silent 2>/dev/null; then
  echo -e "${G}■${N} Lint OK"
else
  echo -e "${Y}■${N} Lint warnings"
fi

echo ""

# Prompt for action
echo -e "${D}─────────────────────────────────────────${N}"
echo -e "${C}NEXT STEPS${N}"
echo -e "${D}─────────────────────────────────────────${N}"
echo ""
echo -e "  ${D}1.${N} Review changes: ${W}git diff${N}"
echo -e "  ${D}2.${N} Stage all:      ${W}git add .${N}"
echo -e "  ${D}3.${N} Commit:         ${W}git commit -m \"fix: ...\"${N}"
echo -e "  ${D}4.${N} Push:           ${W}git push${N}"
echo ""
echo -e "${D}Or tell Claude: \"commit the QA fixes\"${N}"
echo ""
