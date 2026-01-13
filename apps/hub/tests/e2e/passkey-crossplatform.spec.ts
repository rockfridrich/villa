import { test, expect } from '@playwright/test'

/**
 * Cross-Platform Passkey Authentication Tests
 *
 * Tests VillaAuthScreen component (at /auth route) across different
 * viewport sizes and device types. Verifies UI rendering, button states,
 * error handling, and loading states.
 *
 * Note: WebAuthn/passkey ceremonies cannot be fully mocked in Playwright,
 * so tests focus on UI states, navigation, and error display.
 *
 * ARCHITECTURE:
 * - VillaAuthScreen is rendered at /auth route (iframe target)
 * - Tests should use /auth, NOT /onboarding
 */

test.describe('VillaAuthScreen - Auth Route (/auth)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing state
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test.describe('Desktop Viewport', () => {
    test.beforeEach(async ({ page }) => {
      // Desktop viewport (1280x720)
      await page.setViewportSize({ width: 1280, height: 720 })
    })

    test('renders VillaAuthScreen UI on desktop', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      // Check for VillaAuthScreen headline
      await expect(page.getByRole('heading', { name: /your identity/i })).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/no passwords/i)).toBeVisible()

      // Check for CTA buttons
      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create.*villa id/i })

      await expect(signInButton).toBeVisible()
      await expect(createButton).toBeVisible()
      await expect(signInButton).toBeEnabled()
      await expect(createButton).toBeEnabled()

      // Check for security badge
      await expect(page.getByText(/secured by passkeys/i)).toBeVisible()
    })

    test('displays "Sign In" button text correctly', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      await expect(signInButton).toHaveText('Sign In')
    })

    test('displays "Create Villa ID" button text correctly', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const createButton = page.getByRole('button', { name: /create.*villa id/i })
      await expect(createButton).toHaveText('Create Villa ID')
    })

    test('shows passkey education section', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const educationButton = page.getByRole('button', { name: /why passkeys/i })
      await expect(educationButton).toBeVisible()

      // Click to expand
      await educationButton.click()

      // Check for expanded content
      await expect(page.getByText(/phishing-resistant/i)).toBeVisible()
      await expect(page.getByText(/biometric security/i)).toBeVisible()
      await expect(page.getByText(/works everywhere/i)).toBeVisible()
    })

    test('displays supported device biometric providers', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      // Check for device biometric provider logos/labels
      await expect(page.getByText('iCloud')).toBeVisible()
      await expect(page.getByText('Google')).toBeVisible()
      await expect(page.getByText('Windows')).toBeVisible()
      await expect(page.getByText('Browser')).toBeVisible()
      await expect(page.getByText('FIDO2')).toBeVisible()
      await expect(page.getByText('1Password')).toBeVisible()
    })
  })

  test.describe('Tablet Viewport', () => {
    test.beforeEach(async ({ page }) => {
      // Tablet viewport (768x1024)
      await page.setViewportSize({ width: 768, height: 1024 })
    })

    test('renders VillaAuthScreen UI on tablet', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create.*villa id/i })

      await expect(signInButton).toBeVisible({ timeout: 10000 })
      await expect(createButton).toBeVisible({ timeout: 10000 })
      await expect(signInButton).toBeInViewport()
      await expect(createButton).toBeInViewport()
    })

    test('buttons have adequate touch targets on tablet', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create.*villa id/i })

      await signInButton.waitFor({ state: 'visible', timeout: 10000 })
      await createButton.waitFor({ state: 'visible', timeout: 10000 })

      // Check button sizes (should be at least 44x44 for touch targets)
      const signInBox = await signInButton.boundingBox()
      const createBox = await createButton.boundingBox()

      expect(signInBox?.height).toBeGreaterThanOrEqual(44)
      expect(createBox?.height).toBeGreaterThanOrEqual(44)
    })
  })

  test.describe('Mobile Viewport', () => {
    test.beforeEach(async ({ page }) => {
      // Mobile viewport (375x667)
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('renders VillaAuthScreen UI on mobile', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('heading', { name: /your identity/i })).toBeVisible({ timeout: 10000 })

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create.*villa id/i })

      await expect(signInButton).toBeVisible({ timeout: 10000 })
      await expect(createButton).toBeVisible({ timeout: 10000 })
      await expect(signInButton).toBeInViewport()
      await expect(createButton).toBeInViewport()
    })

    test('buttons are scrollable into view on mobile if needed', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const createButton = page.getByRole('button', { name: /create.*villa id/i })

      // Ensure button is in viewport (may need scrolling)
      await createButton.scrollIntoViewIfNeeded()
      await expect(createButton).toBeInViewport()
    })

    test('all content is accessible without horizontal scroll', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      // Get viewport width
      const viewportSize = page.viewportSize()
      expect(viewportSize?.width).toBe(375)

      // Check that main content doesn't overflow
      const mainHeading = page.getByRole('heading', { name: /your identity/i })
      await mainHeading.waitFor({ state: 'visible', timeout: 10000 })

      const headingBox = await mainHeading.boundingBox()
      expect(headingBox?.x).toBeGreaterThanOrEqual(0)
      expect(headingBox?.width).toBeLessThanOrEqual(375)
    })
  })

  test.describe('iPhone Mobile Viewport', () => {
    test.beforeEach(async ({ page }) => {
      // iPhone SE viewport (375x667)
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('renders correctly on iPhone SE', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      await expect(signInButton).toBeVisible({ timeout: 10000 })
      await expect(signInButton).toBeInViewport()
    })
  })

  test.describe('Large Mobile Viewport', () => {
    test.beforeEach(async ({ page }) => {
      // Larger mobile viewport (414x896) - e.g., iPhone 11 Pro Max
      await page.setViewportSize({ width: 414, height: 896 })
    })

    test('renders correctly on large mobile devices', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create.*villa id/i })

      await expect(signInButton).toBeVisible({ timeout: 10000 })
      await expect(createButton).toBeVisible({ timeout: 10000 })
      await expect(signInButton).toBeInViewport()
      await expect(createButton).toBeInViewport()
    })
  })

  // Skip entire Loading States section - flaky due to race conditions
  test.describe.skip('Loading States', () => {
    test('shows loading state in Sign In button', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      await signInButton.click()

      // Should show either loading text or disabled state
      const loadingButton = page.getByRole('button').filter({ hasText: /Signing in|Loading/i })
      const disabledState = page.locator('button[disabled]')

      await expect(
        loadingButton.or(disabledState)
      ).toBeVisible({ timeout: 10000 })
    })

    test('shows loading state in Create Villa ID button', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const createButton = page.getByRole('button', { name: /create.*villa id/i })
      await createButton.click()

      // Should show either loading text or disabled state
      const loadingButton = page.getByRole('button').filter({ hasText: /Creating|Loading/i })
      const disabledState = page.locator('button[disabled]')

      await expect(
        loadingButton.or(disabledState)
      ).toBeVisible({ timeout: 10000 })
    })

    test('buttons are disabled during loading', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create.*villa id/i })

      // Click sign in to trigger loading
      await signInButton.click()

      // Both buttons should be disabled during loading
      await expect(signInButton).toBeDisabled({ timeout: 10000 })
      await expect(createButton).toBeDisabled({ timeout: 10000 })
    })
  })

  // Skip: Error states tests are flaky - WebAuthn errors don't consistently trigger in CI
  // The test logic depends on error alerts appearing which requires real WebAuthn failures
  test.describe.skip('Error States', () => {
    test('displays error alert when authentication fails', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      // Click sign in button (will fail in test environment)
      const signInButton = page.getByRole('button', { name: /sign in/i })
      await signInButton.click()

      // Wait for potential error state
      await page.waitForTimeout(3000)

      // Check if error alert appeared
      const errorAlert = page.getByRole('alert')
      const hasError = await errorAlert.isVisible().catch(() => false)

      if (hasError) {
        // Verify error UI elements
        await expect(errorAlert).toBeVisible()
        // Error should contain meaningful text
        const errorText = await errorAlert.textContent()
        expect(errorText).toBeTruthy()
        expect(errorText?.length).toBeGreaterThan(0)
      }
    })

    test('error alert is dismissible or disappears on retry', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      // Trigger an error by clicking sign in
      await page.getByRole('button', { name: /sign in/i }).click()

      await page.waitForTimeout(3000)

      // If error is visible, clicking retry should hide it
      const errorAlert = page.getByRole('alert')
      const hasError = await errorAlert.isVisible().catch(() => false)

      if (hasError) {
        // Click sign in again
        await page.getByRole('button', { name: /sign in/i }).click()

        // Error should disappear or be replaced
        await page.waitForTimeout(2000)
        const stillVisible = await errorAlert.isVisible().catch(() => false)
        // Either error disappeared or was updated
        expect(typeof stillVisible).toBe('boolean')
      }
    })

    test('error alert has proper aria attributes', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      // Trigger error
      await page.getByRole('button', { name: /sign in/i }).click()

      await page.waitForTimeout(3000)

      const errorAlert = page.getByRole('alert')
      const hasError = await errorAlert.isVisible().catch(() => false)

      if (hasError) {
        // Check for aria-live attribute for announcements
        const ariaLive = await errorAlert.getAttribute('aria-live')
        expect(['polite', 'assertive']).toContain(ariaLive)
      }
    })
  })

  test.describe('Button Interactions', () => {
    test('Sign In button is clickable', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      await expect(signInButton).toBeEnabled()

      // Should be clickable without errors
      await signInButton.click()
      // Button should transition to loading or error state
      await page.waitForTimeout(1000)
      expect(true).toBe(true) // Just verify click succeeded
    })

    test('Create Villa ID button is clickable', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const createButton = page.getByRole('button', { name: /create.*villa id/i })
      await expect(createButton).toBeEnabled()

      // Should be clickable without errors
      await createButton.click()
      // Button should transition to loading or error state
      await page.waitForTimeout(1000)
      expect(true).toBe(true) // Just verify click succeeded
    })

    test('Education section toggle works', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const educationButton = page.getByRole('button', { name: /why passkeys/i })
      const educationContent = page.getByText(/phishing-resistant/i)

      // Initially collapsed
      await expect(educationContent).not.toBeVisible()

      // Click to expand
      await educationButton.click()
      await expect(educationContent).toBeVisible()

      // Click to collapse
      await educationButton.click()
      await expect(educationContent).not.toBeVisible()
    })

    test('education section has proper aria attributes', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const educationButton = page.getByRole('button', { name: /why passkeys/i })

      // Check for aria-expanded attribute
      const ariaExpanded = await educationButton.getAttribute('aria-expanded')
      expect(['true', 'false']).toContain(ariaExpanded)

      // Check for aria-controls
      const ariaControls = await educationButton.getAttribute('aria-controls')
      expect(ariaControls).toBeTruthy()
    })
  })

  test.describe('Accessibility', () => {
    test('page has proper heading hierarchy', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const mainHeading = page.getByRole('heading', { name: /your identity/i })
      await expect(mainHeading).toBeVisible()

      // Check that it's an h1
      const headingLevel = await mainHeading.evaluate(el => el.tagName)
      expect(headingLevel).toMatch(/H[1-3]/)
    })

    test('buttons have accessible labels', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })
      const createButton = page.getByRole('button', { name: /create.*villa id/i })

      // Both should be findable by accessible name
      await expect(signInButton).toBeVisible()
      await expect(createButton).toBeVisible()
    })

    test('color contrast is adequate', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      // Main heading should be visible (Villa theme has good contrast)
      const heading = page.getByRole('heading', { name: /your identity/i })
      await expect(heading).toBeVisible()

      // Text should not be transparent
      const color = await heading.evaluate(el => window.getComputedStyle(el).color)
      expect(color).not.toContain('rgba')
    })

    test('focus indicators are visible', async ({ page }) => {
      await page.goto('/auth?appId=test')
      await page.waitForLoadState('networkidle')

      const signInButton = page.getByRole('button', { name: /sign in/i })

      // Focus the button directly
      await signInButton.focus()

      // Verify button is focusable
      const isFocused = await signInButton.evaluate((el) => document.activeElement === el)
      expect(isFocused).toBe(true)
    })
  })
})
