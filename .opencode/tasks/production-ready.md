# Production Ready - Complete Execution Plan

## Current State
- Branch: `feat/villa-id-revamp` (5 commits ahead of main)
- Villa ID Revamp: Complete (Phases 1-5 done)
- Next: E2E cleanup → CI optimization → Merge → Deploy

---

## Phase 1: E2E Test Cleanup [villa-8wx]

### Delete Dead Files
```bash
rm apps/hub/tests/e2e/funding.spec.ts
rm apps/hub/tests/e2e/nickname-edit.spec.ts
```

### Keep Only Essential Tests (8 files, ~50 tests)

| File | Keep | Tests |
|------|------|-------|
| auth-flows.spec.ts | Core auth only | 8 |
| onboarding.spec.ts | Happy path | 5 |
| sdk-iframe.spec.ts | SDK works | 10 |
| developer-portal.spec.ts | Docs loads | 5 |
| returning-user.spec.ts | Sign-in | 5 |
| integration.spec.ts | Core flows | 10 |
| avatar-selection.spec.ts | Happy path | 5 |
| guestbook.spec.ts | Basic post | 2 |

### Tag Essential Tests with @smoke
Add to test names:
```typescript
// Before
test('creates passkey successfully', ...)

// After
test('@smoke creates passkey successfully', ...)
```

### Verify Speed
```bash
bun test:e2e:chromium --grep="@smoke"
# Target: <2 minutes
```

### Commit
```bash
git add -A
git commit -m "test: cleanup E2E - keep 50 fast smoke tests"
bd close villa-8wx
```

---

## Phase 2: CI Optimization [villa-i7j]

### Edit .github/workflows/ci.yml

Add after `build` job:

```yaml
  e2e-smoke:
    runs-on: ubuntu-latest
    needs: [build]
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2

      - name: Cache Playwright
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('**/bun.lock') }}

      - name: Install deps
        run: bun install --frozen-lockfile

      - name: Install Chromium
        run: bunx playwright install chromium --with-deps

      - name: Run smoke tests
        run: cd apps/hub && bun test:e2e:chromium --grep="@smoke"
        env:
          CI: true
```

### Commit
```bash
git add .github/workflows/ci.yml
git commit -m "ci: add fast E2E smoke tests with Playwright cache"
bd close villa-i7j
```

---

## Phase 3: Create PR [villa-ioj]

```bash
git push origin feat/villa-id-revamp

gh pr create --title "feat: Villa ID Revamp - Porto-identical UX" --body "$(cat <<'EOF'
## Summary
- Self-hosted Porto dialog for 1Password support
- Unified UI package (packages/ui)
- Porto-identical dialog (380×520px)
- Simplified docs landing page
- SDK abstraction (getProfile, uploadAvatar)
- E2E cleanup: 245 → 50 fast smoke tests
- CI: Playwright caching + smoke job

## Changes
- `apps/key/` - Porto remote bridge, rpcServer mode
- `apps/hub/` - Dialog host pointing to key.villa.cash
- `apps/developers/` - Minimal landing page
- `packages/ui/` - New shared UI package
- `packages/sdk/` - getProfile, uploadAvatar methods

## Testing
- [x] bun verify passes
- [x] E2E smoke tests pass (<2min)
- [ ] Manual 1Password test after deploy

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Merge & Deploy

### Wait for CI
```bash
gh pr checks --watch
```

### Merge
```bash
gh pr merge --squash
```

### Verify Beta
```bash
sleep 120
curl -sf https://beta.villa.cash/api/health | jq .timestamp
curl -sf https://key.villa.cash | head -5
curl -sf https://docs.villa.cash | head -5
```

---

## Phase 5: Production Tag

### Only after beta verification passes
```bash
git checkout main
git pull origin main
git tag v2.0.0 -m "Villa ID Revamp - Porto-identical UX"
git push --tags
```

### Verify Production
```bash
sleep 180
curl -sf https://villa.cash/api/health | jq .
```

---

## Phase 6: Cleanup

```bash
bd close villa-ioj villa-n5h villa-393 villa-6jq villa-23p villa-2uj villa-7bc
bd sync --flush-only
git branch -d feat/villa-id-revamp
```

---

## Verification Checklist

```
[ ] funding.spec.ts deleted
[ ] nickname-edit.spec.ts deleted
[ ] ~50 tests tagged @smoke
[ ] bun test:e2e:chromium --grep="@smoke" < 2min
[ ] CI workflow has e2e-smoke job
[ ] CI workflow has Playwright cache
[ ] PR created and CI passes
[ ] PR merged to main
[ ] beta.villa.cash healthy
[ ] key.villa.cash responds
[ ] docs.villa.cash loads
[ ] v2.0.0 tag pushed
[ ] villa.cash healthy
[ ] All beads closed
```

---

## If Stuck

```bash
bd update <task-id> --assignee=claude-code --notes="Stuck on: <issue>"
```
