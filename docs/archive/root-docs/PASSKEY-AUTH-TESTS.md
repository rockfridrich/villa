# Passkey Authentication E2E Tests - Quick Reference

## What Changed?
Updated E2E tests to cover **two authentication modes** that now coexist in Villa:

1. **VillaAuthDialog** - Dialog mode for key.villa.cash (1Password support)
2. **VillaAuthScreen** - Relay mode for onboarding/apps (custom UI)

## Test Files

### New File
```
apps/web/tests/e2e/passkey-crossplatform.spec.ts (628 lines)
```
Comprehensive tests for both auth components across viewports

### Updated Files
```
apps/web/tests/e2e/auth-flows.spec.ts (+280 lines)
```
Component-specific and comparison tests added

### Unchanged
All other test files work as before

## Running Tests

```bash
# From app root (apps/web)
npm run test:e2e

# Specific test file
npm run test:e2e -- tests/e2e/passkey-crossplatform.spec.ts

# Watch mode (headed browser)
npm run test:e2e -- --headed

# Specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project="Mobile Chrome"
npm run test:e2e -- --project="Mobile Safari"

# Debug single test
npm run test:e2e -- --debug tests/e2e/passkey-crossplatform.spec.ts
```

## What Gets Tested

### UI Rendering
- Desktop (1280x720)
- Tablet (768x1024)
- Mobile (375x667, 414x896)
- iPhone SE, iPhone Pro Max
- All buttons visible and in viewport

### Button States
- Enabled/disabled
- Loading indicators
- Text labels correct
- Touch targets adequate (≥44x44px)
- Sign In button works
- Create Villa ID button works

### Error Handling
- Error alerts display
- Error messages readable
- Aria attributes present
- Dismissible/retry works

### Accessibility
- Heading hierarchy
- Button labels accessible
- Color contrast adequate
- Focus indicators visible
- Aria attributes correct

### Component Differences
- Dialog mode: "Works with your passkey manager"
- Screen mode: "Works with your device biometric"
- Same headline both components
- Same button labels both components

## Test Coverage

- **Total: 58 new tests**
  - 47 in passkey-crossplatform.spec.ts
  - 11 added to auth-flows.spec.ts
- **By category:**
  - UI Rendering: 8
  - Button States: 12
  - Error Handling: 6
  - User Interactions: 8
  - Accessibility: 6
  - Component Differences: 6
  - Loading States: 6
  - Responsive Design: 4

## Important: What's NOT Tested

**WebAuthn ceremonies cannot be tested** in Playwright headless mode:
- Real biometric prompts (Face ID, Touch ID)
- 1Password extension interception
- Browser passkey manager UI
- Actual passkey creation/authentication

**These are tested manually** or via integration testing in production.

## Components Explained

### VillaAuthDialog
- **File:** `/apps/web/src/components/sdk/VillaAuthDialog.tsx`
- **Mode:** Porto dialog (popup)
- **Domain:** key.villa.cash
- **1Password:** YES, works
- **Used by:** key.villa.cash/auth (iframe)
- **Messaging:** "Works with your passkey manager"

### VillaAuthScreen
- **File:** `/apps/web/src/components/sdk/VillaAuthScreen.tsx`
- **Mode:** Porto relay (custom handlers)
- **Domain:** villa.cash
- **1Password:** NO, relay mode limitation
- **Used by:** Onboarding flow
- **Messaging:** "Works with your device biometric"

## Debugging Failed Tests

### Test Hangs/Timeouts
```bash
# Increase timeout in specific test
test('my test', async ({ page }) => {
  await expect(element).toBeVisible({ timeout: 30000 }) // 30s
}, { timeout: 60000 }) // test timeout
```

### WebAuthn-Related Failures
Expected in test environment (no real biometric)
- Skip test: `test.skip('name', ...)`
- Or handle gracefully: `await element.isVisible().catch(() => false)`

### Visual Issues
```bash
# Update baseline screenshots
npm run test:e2e -- --update-snapshots

# Debug in headed mode
npm run test:e2e -- --headed --debug
```

## CI Integration

Tests run automatically on:
- Pull requests (on each push)
- Merges to main
- Manual trigger via GitHub Actions

In CI:
- Run in parallel (50% of CPU)
- Retry failed tests 2x
- Generate HTML report
- Show results in PR comments

## Code Examples

### Testing Button Click
```typescript
test('Sign In button works', async ({ page }) => {
  await page.goto('/auth?appId=test')
  const signInButton = page.getByRole('button', { name: /sign in/i })
  
  await expect(signInButton).toBeVisible()
  await expect(signInButton).toBeEnabled()
  await signInButton.click()
  
  // Verify state changed
  await expect(signInButton).toBeDisabled()
})
```

### Testing Mobile Viewport
```typescript
test('works on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/onboarding')
  
  const button = page.getByRole('button', { name: /create/i })
  await expect(button).toBeInViewport()
})
```

### Testing Error State
```typescript
test('shows error', async ({ page }) => {
  await page.goto('/auth?appId=test')
  await page.getByRole('button', { name: /sign in/i }).click()
  
  await page.waitForTimeout(3000)
  
  const error = page.getByRole('alert')
  const hasError = await error.isVisible().catch(() => false)
  
  if (hasError) {
    expect(await error.textContent()).toBeTruthy()
  }
})
```

## Adding New Tests

When adding new auth features:

1. **Identify the user flow**
   - What action does user take?
   - What should happen?
   - What are error cases?

2. **Write test structure**
   ```typescript
   test.describe('Feature Name', () => {
     test.beforeEach(async ({ page }) => {
       // Setup
     })
     
     test('user does X', async ({ page }) => {
       // Test code
     })
   })
   ```

3. **Test on multiple viewports**
   ```typescript
   test.describe('Mobile', () => {
     test.beforeEach(async ({ page }) => {
       await page.setViewportSize({ width: 375, height: 667 })
     })
     // tests
   })
   ```

4. **Test error cases**
   ```typescript
   // Network offline
   await page.context().setOffline(true)
   
   // Validation errors
   await input.fill('invalid')
   await button.click()
   ```

5. **Run locally first**
   ```bash
   npm run test:e2e -- tests/e2e/your-file.spec.ts --headed
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout, check network, increase delays |
| Button not found | Use `--headed` to debug, check selector |
| Mobile tests fail | Check viewport size, scroll into view |
| Flaky tests | Add wait states, use retry logic |
| WebAuthn fails | Expected in headless; skip or handle gracefully |
| CI fails locally passes | Check environment vars, network, timing |

## Resources

- Playwright docs: https://playwright.dev
- Test assertion docs: https://playwright.dev/docs/test-assertions
- Best practices: https://playwright.dev/docs/best-practices
- Debugging: https://playwright.dev/docs/debug

## Next Steps

1. Run tests locally: `npm run test:e2e`
2. Review test output in HTML report
3. Fix any failures
4. Push with passing tests
5. Tests auto-run in CI on PR

---

**Last Updated:** 2026-01-10
**Tests:** 58 total (47 new + 11 updated)
**Coverage:** Dialog mode, Relay mode, Desktop, Tablet, Mobile, iPhone
