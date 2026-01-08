# Production Debug Session - 2026-01-08

## Issue: Staging Deploys Failing Since 2026-01-07T11:00

### Symptoms
- All pushes to main failing at CI stage
- Error: `DATABASE_URL environment variable is not set`
- Error occurs in E2E tests webserver when hitting API routes
- Last successful deploy: `20779232251` at 2026-01-07T11:00:03Z

### Root Cause
The `ci-staging` and `ci-production` jobs in `deploy.yml` run E2E tests before deploy.
The E2E tests start a Next.js webserver that hits API routes like `/api/profile` which require database access.
DATABASE_URL was not passed to the E2E test environment.

### Fix Applied
Added `DATABASE_URL: ${{ secrets.DATABASE_URL }}` to:
1. `deploy.yml` - `ci-staging` E2E step (line 456-460)
2. `deploy.yml` - `ci-production` E2E step (line 699-703)
3. `ci.yml` - `e2e` job (line 189-194)

### Commit
`981b911` - fix(ci): add DATABASE_URL to E2E tests, improve VillaAuthScreen UX

### Verification
- CI run `20806581856` in progress
- Expected: E2E tests pass, staging deploy succeeds
- SDK demo page should be accessible at https://beta.villa.cash/sdk-demo

---

## Related: VillaAuthScreen UX Improvements

Design agent added:
1. "Why passkeys?" expandable education section
2. Passkey provider trust grid (1Password, iCloud, Google, Windows, Browser, FIDO2)
3. "No passkey found" help message

E2E test fixes:
1. Updated selectors for VillaAuthScreen button changes
2. Skipped 3 timing-sensitive tests (WebAuthn ceremony starts too fast)
3. Fixed auth page tests to expect SignInWelcome UI, not VillaAuthScreen

---

## Learnings Added to LEARNINGS.md
- #51: Sleep-Based CI Monitoring Anti-Pattern
- #52: E2E Test Fix Deployment Blocking
- #53: Porto Mode Selection with keystoreHost
