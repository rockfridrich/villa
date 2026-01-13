import { test, expect } from '@playwright/test'

/**
 * Porto SDK Integration Tests
 *
 * Verifies passkey authentication via Porto SDK works correctly.
 * Run against any environment using BASE_URL:
 *
 *   npm run test:e2e:chromium                           # localhost
 *   BASE_URL=https://example.com npm run test:e2e:chromium  # deployed
 *
 * Note: Actual passkey creation requires manual testing with real
 * biometrics (Face ID, Touch ID, etc). These tests verify the
 * integration points are working.
 */

test.describe('Porto SDK Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/onboarding')
  })

  test('welcome page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.waitForLoadState('networkidle')

    // Check welcome screen renders - onboarding page has "Welcome to Villa" heading
    await expect(page.getByRole('heading', { name: /welcome to villa/i })).toBeVisible()

    // Check Get Started button is present (opens SDK auth iframe)
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible()

    // Filter out expected/benign errors
    const criticalErrors = consoleErrors.filter(
      e =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('Failed to load resource')
    )

    expect(criticalErrors.length).toBe(0)
  })

  // Skip: WebAuthn ceremony starts immediately after click, hard to capture intermediate state
  test.skip('Create Villa ID button triggers Porto flow', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const createBtn = page.getByRole('button', { name: /create villa id/i })
    await expect(createBtn).toBeVisible()

    await createBtn.click()

    // VillaAuth transitions to connecting state showing "Connecting..."
    await expect(
      page
        .getByText(/connecting/i)
        .or(page.locator('iframe[src*="porto"]'))
    ).toBeVisible({ timeout: 5000 })
  })

  // Skip: WebAuthn ceremony starts immediately after click, hard to capture intermediate state
  test.skip('Sign In button triggers Porto flow', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const signInBtn = page.getByRole('button', { name: /sign in/i })
    await expect(signInBtn).toBeVisible()

    await signInBtn.click()

    // VillaAuth transitions to connecting state showing "Connecting..."
    await expect(
      page
        .getByText(/connecting/i)
        .or(page.locator('iframe[src*="porto"]'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('CSP headers allow Porto iframe', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers() || {}

    const csp = headers['content-security-policy'] || ''

    // Check frame-src allows Porto
    expect(csp).toContain('frame-src')
    expect(csp).toContain('porto.sh')

    // Check connect-src allows Porto RPC
    expect(csp).toContain('connect-src')
    expect(csp).toContain('rpc.porto.sh')
  })

  test('security headers are present', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers() || {}

    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })
})
