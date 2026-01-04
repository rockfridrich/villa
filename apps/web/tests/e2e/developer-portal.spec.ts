/**
 * Developer Portal E2E Tests
 *
 * Tests for app registration, credentials display, and developer docs.
 */

import { test, expect } from '@playwright/test'

test.describe('Developer Portal Landing', () => {
  test('displays hero section with SDK value prop', async ({ page }) => {
    await page.goto('/developers')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/identity/i)).toBeVisible()
  })

  test('shows connect wallet CTA button', async ({ page }) => {
    await page.goto('/developers')

    const connectButton = page.getByRole('button', { name: /connect/i })
    await expect(connectButton).toBeVisible()
    await expect(connectButton).toHaveAttribute('type', 'button')
  })

  test('displays feature highlights', async ({ page }) => {
    await page.goto('/developers')

    // Should have feature cards
    const cards = page.locator('[data-testid="feature-card"]')
    await expect(cards).toHaveCount(3)
  })

  test('shows code snippet preview', async ({ page }) => {
    await page.goto('/developers')

    // Should have a code block
    const codeBlock = page.locator('pre code')
    await expect(codeBlock).toBeVisible()
    await expect(codeBlock).toContainText('villa')
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

    await expect(page.getByText(/no apps/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /register/i })).toBeVisible()
  })

  test('displays registered apps as cards', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('villa_developer', JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        apps: [{
          id: 'app_test123',
          name: 'Test App',
          createdAt: new Date().toISOString()
        }]
      }))
    })

    await page.goto('/developers/apps')

    await expect(page.getByText('Test App')).toBeVisible()
    await expect(page.getByText('app_test123')).toBeVisible()
  })
})

test.describe('App Registration Flow', () => {
  test('registration form has required fields', async ({ page }) => {
    await page.goto('/developers/apps/new')

    await expect(page.getByLabel(/app name/i)).toBeVisible()
    await expect(page.getByLabel(/origins/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /register/i })).toBeVisible()
  })

  test('validates app name is required', async ({ page }) => {
    await page.goto('/developers/apps/new')

    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/name.*required/i)).toBeVisible()
  })

  test('validates origin URL format', async ({ page }) => {
    await page.goto('/developers/apps/new')

    await page.getByLabel(/app name/i).fill('Test App')
    await page.getByLabel(/origins/i).fill('invalid-url')
    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/valid.*url/i)).toBeVisible()
  })
})

test.describe('Quick Start Documentation', () => {
  test('displays installation instructions', async ({ page }) => {
    await page.goto('/developers/docs')

    await expect(page.getByText(/npm install/i)).toBeVisible()
    await expect(page.getByText(/@villa\/sdk/)).toBeVisible()
  })

  test('has code tabs for React and Vanilla JS', async ({ page }) => {
    await page.goto('/developers/docs')

    const reactTab = page.getByRole('tab', { name: /react/i })
    const vanillaTab = page.getByRole('tab', { name: /vanilla/i })

    await expect(reactTab).toBeVisible()
    await expect(vanillaTab).toBeVisible()
  })

  test('copy button works', async ({ page }) => {
    await page.goto('/developers/docs')

    const copyButton = page.getByRole('button', { name: /copy/i }).first()
    await copyButton.click()

    // Should show copied feedback
    await expect(page.getByText(/copied/i)).toBeVisible()
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

    const connectButton = page.getByRole('button', { name: /connect/i })
    const buttonBox = await connectButton.boundingBox()

    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('Developer Portal - Accessibility', () => {
  test('heading hierarchy is correct', async ({ page }) => {
    await page.goto('/developers')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveCount(1)
  })

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/developers')

    await page.keyboard.press('Tab')

    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
