# Production Release - Villa ID Revamp

## Pre-Merge Tasks

### 1. Create & Merge PR
```bash
gh pr create --title "feat: Villa ID Revamp - Porto-identical UX" \
  --body "## Summary
- Self-hosted Porto dialog for 1Password support
- Unified UI package (packages/ui)
- Porto-identical dialog (380×520px)
- Simplified docs landing page
- SDK abstraction (getProfile, uploadAvatar)

## Testing
- [x] bun verify passes
- [ ] Manual 1Password test
- [ ] Production smoke test after deploy"
```

### 2. E2E Test Cleanup (BEFORE MERGE)

**Delete these files:**
```bash
rm apps/hub/tests/e2e/funding.spec.ts      # Glide not integrated
rm apps/hub/tests/e2e/nickname-edit.spec.ts # Placeholder only
```

**Remove skipped tests that can't be fixed:**
- `passkey-live.spec.ts` lines 52, 69 (can't automate biometrics)

**Keep only essential tests (~50 fast tests):**
- `auth-flows.spec.ts` → Core auth (8 tests)
- `onboarding.spec.ts` → Happy path (5 tests)
- `sdk-iframe.spec.ts` → SDK integration (10 tests)
- `developer-portal.spec.ts` → Docs works (5 tests)
- `returning-user.spec.ts` → Sign-in flow (5 tests)

---

## CI Optimization

### 3. Add Playwright Browser Caching
Edit `.github/workflows/ci.yml`:
```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/bun.lock') }}
```

### 4. Fast E2E Job (Chromium only)
```yaml
e2e-smoke:
  runs-on: ubuntu-latest
  needs: [build]
  timeout-minutes: 5
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
    - run: bun install --frozen-lockfile
    - run: bunx playwright install chromium --with-deps
    - run: bun test:e2e:chromium --grep="@smoke"
```

Tag essential tests with `@smoke`:
```typescript
test('@smoke creates passkey successfully', async ({ page }) => {
```

---

## Production Deployment

### 5. Merge Strategy
```bash
# Squash merge to keep history clean
gh pr merge --squash --auto
```

### 6. Post-Merge Verification
```bash
# Wait for beta deploy
sleep 120

# Check beta health
curl -sf https://beta.villa.cash/api/health | jq .

# Check key.villa.cash
curl -sf https://key.villa.cash/api/health | jq .

# Check docs
curl -sf https://docs.villa.cash | head -20
```

### 7. Production Tag
```bash
# Only after beta verification
git tag v2.0.0
git push --tags
```

### 8. Production Verification
```bash
# After tag triggers production deploy
curl -sf https://villa.cash/api/health | jq .

# Manual 1Password test on production
# [ ] Create new passkey
# [ ] 1Password prompt appears
# [ ] Sign out + sign in
# [ ] 1Password offers saved passkey
```

---

## Rollback Plan

If issues after production deploy:
```bash
# Revert to previous tag
git revert HEAD
git tag v2.0.1
git push && git push --tags
```

---

## Beads Cleanup

After successful production:
```bash
bd close villa-n5h villa-393 villa-6jq villa-23p villa-2uj villa-7bc
bd sync --flush-only
```
