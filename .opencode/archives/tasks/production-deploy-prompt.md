# OpenCode Prompt: Validate & Production Deploy

**Priority:** P0 - URGENT
**Context:** Owner leaving for flight, needs autonomous deploy

---

## MISSION

Validate all changes on current branch, merge to main, and ensure production deployment succeeds. Owner will be offline - work autonomously until complete.

---

## STEP 1: Check Current State

```bash
bd prime
git status
git branch
git log --oneline -5
```

Verify you're on the correct branch with pending changes.

---

## STEP 2: Run Full Verification

```bash
bun verify
```

This runs typecheck + lint + tests. **MUST PASS** before proceeding.

If it fails:
1. Read the error carefully
2. Fix the issue (use @fix agent for small fixes)
3. Re-run `bun verify`
4. Max 2 attempts per error type - if stuck, create Beads task and stop

---

## STEP 3: Check What Changed

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

Review the changes going to production. Look for:
- Security-sensitive files (auth, API keys)
- Breaking changes to SDK
- Database migrations

---

## STEP 4: Merge to Main

```bash
git checkout main
git pull origin main
git merge --no-ff HEAD@{1} -m "$(cat <<'EOF'
chore: merge feature branch for production deploy

Changes:
- Agent orchestration updates (Qwen/Gemini/Grok routing)
- opencode.json model configuration
- THREE_PLATFORMS.md protocol documentation
- Test cleanup task prompt

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>
EOF
)"
```

If merge conflicts:
1. Resolve them carefully
2. Run `bun verify` again after resolution
3. Commit the merge

---

## STEP 5: Push to Main (Triggers Production Deploy)

```bash
git push origin main
```

Railway auto-deploys on push to main.

---

## STEP 6: Verify Deployment

Wait 2-3 minutes, then check:

```bash
# Check deployment health
curl -s https://villa.cash/api/health | jq .
curl -s https://key.villa.cash/api/health | jq .
curl -s https://docs.villa.cash/api/health | jq .

# Check CI status
gh run list --limit 5
```

**Expected:** All endpoints return 200 with recent timestamps.

If deployment fails:
1. Check Railway logs: `railway logs`
2. Check GitHub Actions: `gh run view --log-failed`
3. If critical failure, revert: `git revert HEAD && git push`

---

## STEP 7: Post-Deploy Verification

```bash
# Quick smoke test
curl -s https://villa.cash/ | head -20
curl -s https://villa.cash/auth | head -20
```

---

## STEP 8: Close Out

```bash
bd sync --flush-only
bd list --status=open
```

Create any follow-up tasks discovered during deploy.

---

## EMERGENCY ROLLBACK

If production is broken:

```bash
git revert HEAD
git push origin main
# Wait for Railway redeploy
curl -s https://villa.cash/api/health | jq .
```

---

## SUCCESS CRITERIA

- [ ] `bun verify` passes
- [ ] Merged to main without conflicts
- [ ] Pushed to origin/main
- [ ] villa.cash returns 200
- [ ] key.villa.cash returns 200
- [ ] docs.villa.cash returns 200
- [ ] No CI failures

---

## AUTONOMOUS MODE RULES

1. **Don't ask questions** - make reasonable decisions
2. **If stuck 2x on same error** - create Beads task and stop
3. **If production breaks** - rollback immediately
4. **Log everything** - owner will review when back online
5. **No risky experiments** - deploy what's already working

---

## START NOW

```bash
bd prime && git status && bun verify
```
