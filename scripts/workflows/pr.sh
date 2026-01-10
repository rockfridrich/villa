#!/bin/bash
# Enforced PR workflow
# Usage: ./scripts/workflows/pr.sh [base-branch]

set -e

BASE_BRANCH=${1:-main}

echo "🔒 ENFORCED PR PROTOCOL"
echo "======================="

# Step 1: Ensure on feature branch
echo ""
echo "1️⃣  Checking branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌ Cannot create PR from main branch"
  echo "Create a feature branch first: git checkout -b feat/my-feature"
  exit 1
fi
echo "✅ On branch: $CURRENT_BRANCH"

# Step 2: Run full verification
echo ""
echo "2️⃣  Running full verification..."
pnpm verify || { echo "❌ Verification failed"; exit 1; }

# Step 3: Check for unpushed commits
echo ""
echo "3️⃣  Checking remote sync..."
git fetch origin "$BASE_BRANCH" 2>/dev/null || true

UNPUSHED=$(git log "origin/$CURRENT_BRANCH..HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNPUSHED" -gt 0 ]; then
  echo "⚠️  $UNPUSHED unpushed commits. Pushing..."
  git push -u origin "$CURRENT_BRANCH"
fi

# Step 4: Show diff summary
echo ""
echo "4️⃣  Changes in this PR:"
git log "$BASE_BRANCH..HEAD" --oneline
echo ""
git diff "$BASE_BRANCH..HEAD" --stat | tail -5

# Step 5: Generate PR body
echo ""
echo "5️⃣  Generating PR..."

PR_TITLE=$(git log -1 --format=%s)
COMMIT_COUNT=$(git log "$BASE_BRANCH..HEAD" --oneline | wc -l | tr -d ' ')

PR_BODY="## Summary

- Branch: \`$CURRENT_BRANCH\`
- Commits: $COMMIT_COUNT
- Base: \`$BASE_BRANCH\`

## Changes

$(git log "$BASE_BRANCH..HEAD" --format='- %s' | head -10)

## Test Plan

- [ ] TypeScript passes
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual verification

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# Step 6: Create PR
echo ""
echo "6️⃣  Creating PR..."
PR_URL=$(gh pr create --title "$PR_TITLE" --body "$PR_BODY" --base "$BASE_BRANCH" 2>&1)

echo ""
echo "✅ PR created: $PR_URL"
echo ""
echo "Next steps:"
echo "  1. CI will run automatically"
echo "  2. Review PR at: $PR_URL"
echo "  3. Merge when checks pass"
