# Test Infrastructure Improvement Plan

**Status:** Draft
**Author:** Claude Code
**Created:** 2026-01-10
**Priority:** P1

---

## Executive Summary

This proposal addresses three critical areas of test infrastructure improvement:
1. **E2E Test Speed Optimization** - Run E2E tests only when necessary and parallelize execution
2. **Test Coverage Expansion** - Ensure all packages have unit/integration tests
3. **Coverage Visibility** - Display test coverage badges on GitHub

Current state: 46 test files across the monorepo with significant gaps in `@villa/ui` and `@villa/config` packages.

---

## Part 1: E2E Test Speed Optimization

### Current State

| Metric | Value |
|--------|-------|
| E2E test files | 14 active |
| Current sharding | 2 shards |
| CI workers | 50% CPU (~2 workers) |
| Browser matrix | Chromium only in CI |
| Average E2E run | ~3-5 minutes |

### Problem Analysis

1. **All E2E tests run on every PR** - Even for docs/config changes
2. **Limited sharding** - Only 2 shards limits parallelism
3. **No test impact analysis** - No smart test selection based on changed files
4. **Sequential setup** - Browser install happens serially

### Proposed Solutions

#### Phase 1: Intelligent Test Selection (Quick Win)

**1.1 Path-Based Test Filtering**

Add a workflow step that determines which tests to run based on changed files:

```yaml
# .github/workflows/ci.yml
determine-tests:
  runs-on: ubuntu-latest
  outputs:
    run_e2e: ${{ steps.filter.outputs.e2e }}
    run_unit: ${{ steps.filter.outputs.unit }}
    e2e_filter: ${{ steps.filter.outputs.e2e_filter }}
  steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          e2e:
            - 'apps/web/src/**'
            - 'packages/sdk/**'
            - 'apps/web/tests/e2e/**'
          unit:
            - 'apps/web/src/**'
            - 'packages/**'
          auth:
            - 'apps/web/src/components/auth/**'
            - 'apps/web/src/lib/porto.ts'
          sdk:
            - 'packages/sdk/**'
            - 'apps/web/src/components/sdk/**'
```

**1.2 Component-to-Test Mapping**

Create a mapping file that links source files to relevant E2E tests:

```typescript
// apps/web/tests/e2e/test-mapping.ts
export const componentTestMap: Record<string, string[]> = {
  'src/components/auth/**': ['auth-flows.spec.ts', 'passkey-*.spec.ts'],
  'src/components/onboarding/**': ['onboarding.spec.ts', 'returning-user.spec.ts'],
  'src/components/sdk/**': ['sdk-*.spec.ts', 'integration.spec.ts'],
  'src/components/funding/**': ['funding.spec.ts'],
  'src/components/developer/**': ['developer-portal.spec.ts'],
  'src/lib/porto.ts': ['auth-flows.spec.ts', 'passkey-*.spec.ts'],
  'src/lib/store.ts': ['**/*.spec.ts'], // Store affects everything
  'packages/sdk/**': ['sdk-*.spec.ts', 'integration.spec.ts'],
};
```

#### Phase 2: Enhanced Parallelization

**2.1 Increase Shard Count**

```yaml
# Current: 2 shards
# Proposed: 4 shards for faster completion
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: pnpm exec playwright test --shard=${{ matrix.shard }}/4
```

**2.2 Playwright Test Grouping**

Group tests by execution time and dependencies:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'fast-chromium',
      testMatch: ['**/guestbook.spec.ts', '**/nickname-edit.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'auth-chromium',
      testMatch: ['**/auth-*.spec.ts', '**/passkey-*.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      dependencies: [], // Can run independently
    },
    {
      name: 'sdk-chromium',
      testMatch: ['**/sdk-*.spec.ts', '**/integration.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

#### Phase 3: Caching & Infrastructure

**3.1 Browser Cache Optimization**

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: |
      ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package.json') }}
    restore-keys: |
      playwright-${{ runner.os }}-
```

**3.2 Parallel Browser Installation**

```yaml
- name: Install Playwright browsers (parallel)
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: |
    pnpm exec playwright install chromium --with-deps &
    PID=$!
    # Continue other setup while installing
    pnpm build
    wait $PID
```

**3.3 Test Result Caching**

Implement test result caching for unchanged files:

```yaml
- name: Cache test results
  uses: actions/cache@v4
  with:
    path: apps/web/test-results
    key: e2e-results-${{ hashFiles('apps/web/src/**', 'apps/web/tests/e2e/**') }}
```

### Expected Impact

| Optimization | Time Savings | Implementation Effort |
|-------------|-------------|----------------------|
| Path-based filtering | 60-80% (for non-code PRs) | Low |
| Component-test mapping | 30-50% (targeted runs) | Medium |
| 4-shard parallelization | 40-50% | Low |
| Browser caching | 30-60s per run | Low |
| Test result caching | Variable | Medium |

**Total potential improvement: 50-70% reduction in average E2E time**

---

## Part 2: Test Coverage Expansion

### Current Coverage Gaps

| Package | Test Files | Coverage | Status |
|---------|-----------|----------|--------|
| @villa/web | 26 | Configured | Active |
| @villa/sdk | 5 | Configured | Active |
| @villa/api | 5 | Configured | Active |
| @villa/ui | 0 | None | **GAP** |
| @villa/config | 0 | None | **GAP** |
| contracts | 6 | Codecov | Active |

### Package-by-Package Plan

#### @villa/ui (Priority: High)

**Current state:** No tests, no coverage configuration

**Required tests:**
1. Component snapshot tests
2. Accessibility tests (a11y)
3. Visual regression tests
4. Component behavior tests

**Implementation:**

```bash
# packages/ui/package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

```typescript
// packages/ui/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.tsx', 'src/**/index.ts'],
    },
  },
});
```

**Test files to create:**
- `src/__tests__/Button.test.tsx`
- `src/__tests__/Input.test.tsx`
- `src/__tests__/Modal.test.tsx`
- `src/__tests__/accessibility.test.tsx`

**Coverage target:** 80%+

#### @villa/config (Priority: Medium)

**Current state:** No tests

**Required tests:**
1. Configuration validation tests
2. Schema validation tests
3. Type export tests

**Implementation:**

```typescript
// packages/config/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.ts'],
    },
  },
});
```

**Test files to create:**
- `src/__tests__/eslint.test.ts`
- `src/__tests__/typescript.test.ts`

**Coverage target:** 90%+

#### @villa/web - Integration Tests (Priority: High)

**Current state:** Only placeholder files

**Required tests:**
1. Full component integration tests
2. Page-level integration tests
3. State management integration tests
4. API mocking with MSW

**Test files to create:**
- `tests/integration/auth-flow.test.tsx`
- `tests/integration/onboarding-flow.test.tsx`
- `tests/integration/sdk-integration.test.tsx`
- `tests/integration/api-mocking.test.tsx`

**Coverage target:** 70%+

### Mock Strategy

```typescript
// apps/web/tests/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/health', (req, res, ctx) => {
    return res(ctx.json({ status: 'ok', timestamp: Date.now() }));
  }),
  rest.post('/api/auth/passkey/*', (req, res, ctx) => {
    return res(ctx.json({ success: true, userId: 'test-user' }));
  }),
];
```

---

## Part 3: Coverage Visibility on GitHub

### Current State

- Codecov configured for contracts only
- Vitest generates coverage but not uploaded
- No coverage badges in README
- No PR coverage comments

### Implementation Plan

#### 3.1 Codecov Configuration

```yaml
# codecov.yml (root)
codecov:
  require_ci_to_pass: true

coverage:
  precision: 2
  round: down
  range: "60...100"

  status:
    project:
      default:
        target: auto
        threshold: 5%
    patch:
      default:
        target: 80%

parsers:
  gcov:
    branch_detection:
      conditional: yes
      loop: yes
      method: no
      macro: no

comment:
  layout: "reach,diff,flags,files"
  behavior: default
  require_changes: true

flags:
  web:
    paths:
      - apps/web/
    carryforward: true
  sdk:
    paths:
      - packages/sdk/
    carryforward: true
  ui:
    paths:
      - packages/ui/
    carryforward: true
  api:
    paths:
      - apps/api/
    carryforward: true
  contracts:
    paths:
      - contracts/
    carryforward: true
```

#### 3.2 CI Workflow Updates

```yaml
# .github/workflows/ci.yml - Add coverage upload
unit-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'pnpm'
    - run: pnpm install
    - run: pnpm test:coverage
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        flags: web,sdk,api
        files: |
          apps/web/coverage/lcov.info
          packages/sdk/coverage/lcov.info
          apps/api/coverage/lcov.info
        fail_ci_if_error: false
```

#### 3.3 README Badges

```markdown
<!-- Add to README.md -->
[![codecov](https://codecov.io/gh/rockfridrich/villa/branch/main/graph/badge.svg)](https://codecov.io/gh/rockfridrich/villa)
[![Tests](https://github.com/rockfridrich/villa/actions/workflows/ci.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/ci.yml)
```

#### 3.4 PR Coverage Comments

Codecov automatically adds coverage comments to PRs showing:
- Overall coverage change
- Files changed with coverage delta
- Uncovered lines
- Coverage sunburst graph

### Coverage Targets

| Package | Current | Target | Priority |
|---------|---------|--------|----------|
| @villa/web (unit) | ~60% | 80% | High |
| @villa/sdk | ~70% | 90% | High |
| @villa/ui | 0% | 80% | High |
| @villa/api | ~50% | 80% | Medium |
| @villa/config | 0% | 90% | Low |
| contracts | ~80% | 95% | High |

---

## Implementation Roadmap

### Phase 1: Quick Wins (Week 1)

- [ ] Add path-based test filtering to CI
- [ ] Increase E2E shards from 2 to 4
- [ ] Configure Codecov for all packages
- [ ] Add coverage badges to README
- [ ] Fix unit test CI execution (jest-dom matchers issue)

### Phase 2: Coverage Expansion (Week 2-3)

- [ ] Add @villa/ui test infrastructure
- [ ] Write initial @villa/ui component tests
- [ ] Add @villa/config tests
- [ ] Convert integration test placeholders to real tests
- [ ] Set up MSW for API mocking

### Phase 3: Advanced Optimization (Week 4)

- [ ] Implement component-to-test mapping
- [ ] Add test result caching
- [ ] Optimize browser installation
- [ ] Add visual regression testing for UI components
- [ ] Set up accessibility testing automation

### Phase 4: Monitoring & Maintenance (Ongoing)

- [ ] Set up coverage trend monitoring
- [ ] Add coverage gates (block PR if coverage drops)
- [ ] Monthly test performance review
- [ ] Quarterly test strategy review

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| E2E run time (average) | ~4 min | < 2 min |
| PRs skipping E2E (eligible) | 0% | 40%+ |
| Overall test coverage | ~40% | 75%+ |
| Packages with tests | 4/6 | 6/6 |
| Coverage visible on GitHub | No | Yes |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| False negatives from test skipping | High | Component mapping + smoke tests always run |
| Coverage gaming | Medium | Require meaningful tests, review coverage diff |
| Flaky E2E tests | High | Retry strategy + test stability monitoring |
| CI time regression | Medium | Time budgets + alerts |

---

## Dependencies

- Codecov token in GitHub secrets
- CI runner time budget approval
- Team alignment on coverage targets

---

## Related

- [TESTING.md](/TESTING.md) - Existing test documentation
- [CI Workflow](/.github/workflows/ci.yml) - Current CI configuration
- [Playwright Config](/apps/web/playwright.config.ts) - E2E configuration
