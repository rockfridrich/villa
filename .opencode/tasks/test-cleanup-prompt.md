# OpenCode Prompt: Test Cleanup & Fast CI

**Priority:** P1
**Branch:** chore/test-cleanup

---

## SESSION START

```bash
bd prime
bd create --title="Clean up tests - focus on SDK and key.villa.cash smoke tests" --type=task --priority=1
git checkout -b chore/test-cleanup
```

---

## PROBLEM

Current test suite has:
- Too many E2E tests that are slow and often irrelevant
- Tests spread across multiple directories without clear organization
- Many tests for features that have changed or been removed
- CI takes too long due to redundant tests

## GOAL

Fast, focused test suite that:
1. Runs in < 30 seconds for smoke tests
2. Covers SDK core functionality
3. Covers key.villa.cash critical paths
4. Removes irrelevant/broken tests

---

## TEST INVENTORY

### E2E Tests (Review for Relevance)

**Root tests/ directory:**
- `tests/e2e/integration.spec.ts`
- `tests/e2e/onboarding.spec.ts`
- `tests/e2e/passkey-live.spec.ts` - KEEP if testing real passkey flow
- `tests/e2e/avatar-selection.spec.ts`

**apps/hub/tests/e2e/:**
- `auth-flows.spec.ts` - KEEP (critical path)
- `sdk-iframe.spec.ts` - KEEP (SDK integration)
- `onboarding.spec.ts` - KEEP (new user flow)
- `returning-user.spec.ts` - Review
- `avatar-selection.spec.ts` - Review
- `developer-portal.spec.ts` - Review
- `guestbook.spec.ts` - Review (low priority feature)
- `integration.spec.ts` - Review

**Security tests:**
- `tests/security/comprehensive.spec.ts`
- `tests/security/xss.spec.ts`
- `apps/hub/tests/security/*.spec.ts`

### Unit Tests (Keep, ensure fast)

**SDK unit tests (PRIORITY):**
- `packages/sdk/src/__tests__/session.test.ts`
- `packages/sdk/src/__tests__/avatar.test.ts`
- `packages/sdk/src/__tests__/auth-utils.test.ts`

**Other unit tests:**
- `tests/unit/porto.test.ts`
- `tests/unit/store.test.ts`
- `tests/unit/validation.test.ts`
- `apps/api/tests/*.test.ts`

---

## IMPLEMENTATION STEPS

### Step 1: Audit E2E Tests

For each E2E test, check:
1. Does it test current functionality?
2. Does it pass locally?
3. Is it testing critical user flows?

```bash
# Run each E2E test individually
bun playwright test tests/e2e/integration.spec.ts --timeout=60000
bun playwright test tests/e2e/onboarding.spec.ts --timeout=60000
# etc.
```

### Step 2: Remove Irrelevant Tests

Delete tests that:
- Test removed features
- Duplicate other tests
- Are flaky without clear fix
- Test low-priority flows

### Step 3: Consolidate Test Structure

Target structure:
```
tests/
├── unit/           # Fast unit tests (< 5s total)
│   ├── sdk/        # SDK core tests
│   └── lib/        # Utility tests
├── integration/    # API integration tests (< 10s total)
└── e2e/            # Critical path E2E only (< 30s total)
    ├── smoke.spec.ts        # Main smoke test
    └── sdk-auth.spec.ts     # SDK auth flow
```

### Step 4: Create Focused Smoke Test

**File:** `tests/e2e/smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('hub loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Villa/);
  });

  test('auth page loads', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
  });

  test('health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });
});
```

### Step 5: Update Test Scripts

**In package.json:**
```json
{
  "scripts": {
    "test": "bun run test:unit",
    "test:unit": "bun test --timeout 10000",
    "test:integration": "bun playwright test tests/integration/",
    "test:e2e": "bun playwright test tests/e2e/smoke.spec.ts",
    "test:e2e:full": "bun playwright test tests/e2e/",
    "test:ci": "bun run test:unit && bun run test:e2e"
  }
}
```

### Step 6: Update CI Workflow

Ensure `bun verify` runs fast tests only:
- Unit tests
- Smoke E2E tests
- Skip full E2E on every push (run on merge to main only)

---

## VERIFICATION

```bash
# All unit tests pass and are fast
time bun test
# Should be < 10 seconds

# Smoke E2E tests pass
time bun playwright test tests/e2e/smoke.spec.ts
# Should be < 30 seconds

# Full verify passes
bun verify
```

---

## COMMIT

```bash
git add -A && git commit -m "$(cat <<'EOF'
chore(tests): clean up and focus test suite

- Remove irrelevant/broken E2E tests
- Create focused smoke test suite
- Update test scripts for fast CI
- Keep SDK unit tests as priority
- Consolidate test structure

Target: < 30s for CI smoke tests

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>
EOF
)"
```

---

## WHEN DONE

```bash
bd close <id> --reason="Tests cleaned up"
bd sync --flush-only
git push -u origin chore/test-cleanup
gh pr create --title "chore(tests): clean up and focus test suite" --body "..."
```

---

## NOTES

- Do NOT delete SDK unit tests - these are critical
- Do NOT delete security tests - review but keep
- Focus on removing E2E tests that test removed/changed features
- If unsure about a test, run it first to see if it still works
