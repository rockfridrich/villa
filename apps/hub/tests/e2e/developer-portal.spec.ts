/**
 * Developer Portal E2E Tests
 *
 * Tests for app registration, credentials display, and developer docs.
 */

import { test, expect } from '@playwright/test'

test.describe('Developer Portal Landing', () => {
  test('displays hero section with SDK value prop', async ({ page }) => {
    await page.goto('/developers')

    // Check for the specific heading text
    const heading = page.getByRole('heading', { level: 1, name: 'Villa Identity SDK' })
    await expect(heading).toBeVisible()

    // Check for tagline with specific text
    await expect(page.getByText('Privacy-first passkey authentication on Base')).toBeVisible()
  })

  test('shows connect wallet CTA button', async ({ page }) => {
    await page.goto('/developers')

    // More specific button selector
    const connectButton = page.getByRole('button', { name: /Connect Wallet|View Dashboard/i })
    await expect(connectButton).toBeVisible()
  })

  test('displays feature highlights', async ({ page }) => {
    await page.goto('/developers')

    // Should have feature cards (4 features: Passkey Auth, Privacy-First, Fast Integration, ENS Compatible)
    const cards = page.locator('[data-testid="feature-card"]')
    await expect(cards).toHaveCount(4)
  })

  test('shows code snippet preview', async ({ page }) => {
    await page.goto('/developers')

    // Should have a code block with VillaIdentity
    const codeBlock = page.locator('pre code').filter({ hasText: 'VillaIdentity' })
    await expect(codeBlock).toBeVisible()
  })
})

test.describe('Developer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated developer state
    await page.addInitScript(() => {
      localStorage.setItem('villa_developer', JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        apps: []
      }))
    })
  })

  test('shows empty state when no apps registered', async ({ page }) => {
    await page.goto('/developers/apps')

    // More specific empty state text
    await expect(page.getByText('No apps registered yet', { exact: true })).toBeVisible()
    // Button in empty state has specific text
    await expect(page.getByRole('button', { name: 'Register Your First App' })).toBeVisible()
  })

  test('displays registered apps as cards', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('villa_developer', JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        apps: [{
          id: 'app_test123',
          appId: 'test-app',
          appName: 'Test App',
          status: 'active',
          createdAt: new Date().toISOString()
        }]
      }))
    })

    await page.goto('/developers/apps')

    // Check for app name in heading (CardTitle)
    await expect(page.getByRole('heading', { name: 'Test App' })).toBeVisible()
    // Check for app ID in text content
    await expect(page.getByText('test-app', { exact: true })).toBeVisible()
  })
})

test.describe('App Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated developer state for app registration
    await page.addInitScript(() => {
      localStorage.setItem('villa_developer', JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        apps: []
      }))
    })
  })

  test('registration form has required fields', async ({ page }) => {
    await page.goto('/developers/apps/new')

    // Component uses exact label text with asterisks
    await expect(page.locator('label[for="appId"]')).toBeVisible()
    await expect(page.locator('label[for="origins"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Register & Sign' })).toBeVisible()
  })

  test('validates app id is required', async ({ page }) => {
    await page.goto('/developers/apps/new')

    // Use specific IDs from component
    await page.locator('#origins').fill('https://example.com')
    await page.getByRole('button', { name: 'Register & Sign' }).click()

    // HTML5 validation should trigger
    const appIdInput = page.locator('#appId')
    await expect(appIdInput).toHaveAttribute('required')
  })

  test('validates origin is required', async ({ page }) => {
    await page.goto('/developers/apps/new')

    // Fill app ID but leave origins empty
    await page.locator('#appId').fill('test-app')

    // Check that origins field has required attribute (HTML5 validation)
    const originsTextarea = page.locator('#origins')
    await expect(originsTextarea).toHaveAttribute('required')

    // Try to submit - browser validation should prevent it
    // But we can still check the custom validation by temporarily removing required
    await originsTextarea.evaluate((el) => el.removeAttribute('required'))
    await page.getByRole('button', { name: 'Register & Sign' }).click()

    // Form should show custom error for missing origins
    await expect(page.getByText('At least one allowed origin is required')).toBeVisible()
  })
})

test.describe('Quick Start Documentation', () => {
  test('displays installation instructions', async ({ page }) => {
    await page.goto('/developers/docs')

    // Look for specific npm install command in code block
    const installCode = page.locator('pre').filter({ hasText: 'npm install @rockfridrich/villa-sdk' })
    await expect(installCode).toBeVisible()
  })

  test('has code tabs for React and Vanilla JS', async ({ page }) => {
    await page.goto('/developers/docs')

    // Specific tab names from component
    const reactTab = page.getByRole('tab', { name: 'React' })
    const vanillaTab = page.getByRole('tab', { name: 'Vanilla JS' })

    await expect(reactTab).toBeVisible()
    await expect(vanillaTab).toBeVisible()
  })

  test('copy button works', async ({ page }) => {
    await page.goto('/developers/docs')

    // Grant clipboard permissions for the test
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // Find copy button by aria-label
    const copyButton = page.getByRole('button', { name: 'Copy code' }).first()
    await copyButton.click()

    // Should show "Copied" text inside button
    await expect(page.getByText('Copied', { exact: true })).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Developer Portal - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('landing page is responsive', async ({ page }) => {
    await page.goto('/developers')

    // Check no horizontal scroll
    const body = page.locator('body')
    const bodyBox = await body.boundingBox()
    expect(bodyBox?.width).toBeLessThanOrEqual(375)
  })

  test('buttons have adequate touch targets', async ({ page }) => {
    await page.goto('/developers')

    // Use specific button selector
    const connectButton = page.getByRole('button', { name: /Connect Wallet|View Dashboard/i }).first()
    const buttonBox = await connectButton.boundingBox()

    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('Developer Portal - Accessibility', () => {
  test('heading hierarchy is correct', async ({ page }) => {
    await page.goto('/developers')

    // Should have exactly one h1
    const h1Elements = page.getByRole('heading', { level: 1 })
    await expect(h1Elements).toHaveCount(1)
    // Verify it's the main heading
    await expect(h1Elements.first()).toHaveText('Villa Identity SDK')
  })

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/developers')

    // Focus the body first to ensure we start from a known state
    await page.locator('body').focus()

    // Tab to first interactive element (should be the Connect Wallet button)
    await page.keyboard.press('Tab')

    // The button should be focused
    const connectButton = page.getByRole('button', { name: /Connect Wallet|View Dashboard/i }).first()
    await expect(connectButton).toBeFocused()
  })
})
