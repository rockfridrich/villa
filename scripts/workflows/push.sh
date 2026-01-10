#!/bin/bash
# Enforced push workflow with background CI monitoring
# Usage: ./scripts/workflows/push.sh [branch]

set -e

BRANCH=${1:-$(git branch --show-current)}

echo "🔒 ENFORCED PUSH PROTOCOL"
echo "========================="

# Step 1: Pre-push verification
echo ""
echo "1️⃣  Running pre-push verification..."
pnpm verify || { echo "❌ Verification failed - fix before pushing"; exit 1; }

# Step 2: Push
echo ""
echo "2️⃣  Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

# Step 3: Get CI run ID
echo ""
echo "3️⃣  Getting CI run..."
sleep 3  # Give GitHub time to start the workflow
RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || echo "")

if [ -z "$RUN_ID" ]; then
  echo "⚠️  Could not get CI run ID"
  echo "Check manually: https://github.com/rockfridrich/villa/actions"
  exit 0
fi

echo "CI Run: $RUN_ID"
echo "URL: https://github.com/rockfridrich/villa/actions/runs/$RUN_ID"

# Step 4: Background monitoring
echo ""
echo "4️⃣  Starting background CI monitor..."
echo "   Will notify when complete."
echo ""

# Background process to monitor CI
(
  while true; do
    STATUS=$(gh run view "$RUN_ID" --json status,conclusion --jq '.status' 2>/dev/null || echo "unknown")

    if [ "$STATUS" = "completed" ]; then
      CONCLUSION=$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion' 2>/dev/null || echo "unknown")

      if [ "$CONCLUSION" = "success" ]; then
        echo ""
        echo "✅ CI PASSED: https://github.com/rockfridrich/villa/actions/runs/$RUN_ID"
        osascript -e 'display notification "CI Passed!" with title "Villa CI"' 2>/dev/null || true
      else
        echo ""
        echo "❌ CI FAILED: https://github.com/rockfridrich/villa/actions/runs/$RUN_ID"
        echo "Check logs: gh run view $RUN_ID --log-failed"
        osascript -e 'display notification "CI Failed!" with title "Villa CI"' 2>/dev/null || true
      fi
      break
    fi

    sleep 30
  done
) &

echo "✅ Push complete. CI monitoring in background (PID: $!)"
echo ""
echo "Commands:"
echo "  Check status: gh run view $RUN_ID"
echo "  View logs:    gh run view $RUN_ID --log"
echo "  Cancel:       gh run cancel $RUN_ID"
