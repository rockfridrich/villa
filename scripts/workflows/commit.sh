#!/bin/bash
# Enforced commit workflow
# Usage: ./scripts/workflows/commit.sh [message]

set -e

echo "🔒 ENFORCED COMMIT PROTOCOL"
echo "=========================="

# Step 1: Quality gate
echo ""
echo "1️⃣  Running quality gate..."
pnpm typecheck || { echo "❌ Type check failed"; exit 1; }

# Step 2: Check for uncommitted changes
echo ""
echo "2️⃣  Checking git status..."
if git diff --cached --quiet; then
  echo "⚠️  No staged changes. Stage files first with 'git add'"
  git status --short
  exit 1
fi

# Step 3: Show what will be committed
echo ""
echo "3️⃣  Changes to be committed:"
git diff --cached --stat

# Step 4: Generate or use provided message
echo ""
echo "4️⃣  Commit message..."
if [ -n "$1" ]; then
  COMMIT_MSG="$1"
else
  echo "Enter commit message (or Ctrl+C to cancel):"
  read -r COMMIT_MSG
fi

# Step 5: Ensure Co-Authored-By
if ! echo "$COMMIT_MSG" | grep -q "Co-Authored-By:"; then
  COMMIT_MSG="$COMMIT_MSG

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
fi

# Step 6: Commit
echo ""
echo "5️⃣  Committing..."
git commit -m "$COMMIT_MSG"

# Step 7: Verify
echo ""
echo "6️⃣  Verifying commit..."
git log -1 --oneline

echo ""
echo "✅ Commit protocol complete"
echo ""
echo "Next: Run './scripts/workflows/push.sh' to push with CI monitoring"
