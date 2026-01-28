#!/bin/bash
# Git branch cleanup — delete stale remote and local branches
#
# Usage:
#   ./scripts/git-cleanup.sh              # Delete branches older than 14 days
#   ./scripts/git-cleanup.sh --days=7     # Custom age threshold
#   ./scripts/git-cleanup.sh --dry-run    # Preview without deleting
#   ./scripts/git-cleanup.sh --all        # Delete ALL non-main branches (any age)

set -e

# Parse arguments
DAYS=14
DRY_RUN=false
ALL=false

for arg in "$@"; do
    case "$arg" in
        --days=*) DAYS="${arg#*=}" ;;
        --dry-run) DRY_RUN=true ;;
        --all) ALL=true ;;
        --help|-h)
            echo "Usage: ./scripts/git-cleanup.sh [--days=14] [--dry-run] [--all]"
            echo ""
            echo "Options:"
            echo "  --days=N    Delete branches older than N days (default: 14)"
            echo "  --dry-run   Preview what would be deleted"
            echo "  --all       Delete ALL non-main branches regardless of age"
            exit 0
            ;;
    esac
done

echo "Git Branch Cleanup"
echo "========================"
echo ""

# Sync remote refs
git fetch --prune 2>/dev/null

# Cutoff date
if [ "$(uname)" = "Darwin" ]; then
    CUTOFF=$(date -v-${DAYS}d +%s)
else
    CUTOFF=$(date -d "-${DAYS} days" +%s)
fi

# Collect stale remote branches
STALE_REMOTE=""
STALE_COUNT=0

for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | grep -v 'origin/main' | grep -v 'origin/HEAD'); do
    BRANCH="${ref#origin/}"
    COMMIT_DATE=$(git log -1 --format='%ct' "$ref" 2>/dev/null || echo "0")

    if [ "$ALL" = true ] || [ "$COMMIT_DATE" -lt "$CUTOFF" ]; then
        if [ "$(uname)" = "Darwin" ]; then
            HUMAN_DATE=$(date -r "$COMMIT_DATE" +%Y-%m-%d 2>/dev/null || echo "unknown")
        else
            HUMAN_DATE=$(date -d "@$COMMIT_DATE" +%Y-%m-%d 2>/dev/null || echo "unknown")
        fi
        STALE_REMOTE="$STALE_REMOTE\n  $BRANCH ($HUMAN_DATE)"
        STALE_COUNT=$((STALE_COUNT + 1))
    fi
done

# Collect dead local branches (remote gone)
DEAD_LOCAL=$(git branch -vv 2>/dev/null | grep ': gone]' | awk '{print $1}' || true)
DEAD_LOCAL_COUNT=0
if [ -n "$DEAD_LOCAL" ]; then
    DEAD_LOCAL_COUNT=$(echo "$DEAD_LOCAL" | wc -l | tr -d ' ')
fi

# Collect local-only branches (no remote, not main)
LOCAL_ONLY=""
LOCAL_ONLY_COUNT=0
for branch in $(git branch --format='%(refname:short)' | grep -v '^main$'); do
    UPSTREAM=$(git rev-parse --abbrev-ref "${branch}@{upstream}" 2>/dev/null || echo "")
    if [ -z "$UPSTREAM" ]; then
        LOCAL_ONLY="$LOCAL_ONLY\n  $branch"
        LOCAL_ONLY_COUNT=$((LOCAL_ONLY_COUNT + 1))
    fi
done

# Report
echo "Stale remote branches (>${DAYS} days): $STALE_COUNT"
if [ "$STALE_COUNT" -gt 0 ]; then
    echo -e "$STALE_REMOTE"
fi
echo ""

echo "Dead local branches (remote gone): $DEAD_LOCAL_COUNT"
if [ -n "$DEAD_LOCAL" ]; then
    echo "$DEAD_LOCAL" | sed 's/^/  /'
fi
echo ""

echo "Local-only branches (no remote): $LOCAL_ONLY_COUNT"
if [ "$LOCAL_ONLY_COUNT" -gt 0 ]; then
    echo -e "$LOCAL_ONLY"
fi
echo ""

TOTAL=$((STALE_COUNT + DEAD_LOCAL_COUNT + LOCAL_ONLY_COUNT))

if [ "$TOTAL" -eq 0 ]; then
    echo "Nothing to clean up."
    exit 0
fi

echo "Total: $TOTAL branch(es) to clean"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] No branches deleted."
    exit 0
fi

# Confirm
read -p "Delete all $TOTAL branch(es)? (y/N) " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Aborted."
    exit 0
fi

echo ""

# Delete stale remote branches
if [ "$STALE_COUNT" -gt 0 ]; then
    echo "Deleting $STALE_COUNT remote branch(es)..."
    for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | grep -v 'origin/main' | grep -v 'origin/HEAD'); do
        BRANCH="${ref#origin/}"
        COMMIT_DATE=$(git log -1 --format='%ct' "$ref" 2>/dev/null || echo "0")
        if [ "$ALL" = true ] || [ "$COMMIT_DATE" -lt "$CUTOFF" ]; then
            git push origin --delete "$BRANCH" 2>/dev/null && echo "  Deleted remote: $BRANCH" || echo "  Failed: $BRANCH"
        fi
    done
    echo ""
fi

# Delete dead local branches
if [ -n "$DEAD_LOCAL" ]; then
    echo "Deleting $DEAD_LOCAL_COUNT dead local branch(es)..."
    echo "$DEAD_LOCAL" | xargs git branch -D 2>/dev/null || true
    echo ""
fi

# Delete local-only branches
if [ "$LOCAL_ONLY_COUNT" -gt 0 ]; then
    echo "Deleting $LOCAL_ONLY_COUNT local-only branch(es)..."
    for branch in $(git branch --format='%(refname:short)' | grep -v '^main$'); do
        UPSTREAM=$(git rev-parse --abbrev-ref "${branch}@{upstream}" 2>/dev/null || echo "")
        if [ -z "$UPSTREAM" ]; then
            git branch -D "$branch" 2>/dev/null && echo "  Deleted local: $branch" || echo "  Failed: $branch"
        fi
    done
    echo ""
fi

echo "Cleanup complete."
