import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('redirects to onboarding when no identity', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('shows welcome screen with create and sign in buttons', async ({ page }) => {
    await page.goto('/onboarding')

    // VillaAuth uses SignInWelcome which has heading "Your identity. No passwords."
    await expect(page.getByRole('heading', { name: /your identity/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /create.*villa id/i })).toBeVisible()
    await expect(page.getByText(/secured by passkeys/i)).toBeVisible()
  })

  // Skip: WebAuthn ceremony starts immediately, hard to capture "Connecting..." state
  test.skip('shows connecting state when creating identity', async ({ page }) => {
    await page.goto('/onboarding')

    // Click create - VillaAuth transitions to connecting step
    await page.getByRole('button', { name: /create.*villa id/i }).click()

    // VillaAuth shows "Connecting..." text in the connecting step
    await expect(page.getByText(/connecting/i)).toBeVisible({ timeout: 10000 })
  })

  // Skip: WebAuthn ceremony starts immediately, hard to capture "Connecting..." state
  test.skip('shows connecting state when signing in', async ({ page }) => {
    await page.goto('/onboarding')

    await page.getByRole('button', { name: /sign in/i }).click()

    // VillaAuth shows "Connecting..." text in the connecting step
    await expect(page.getByText(/connecting/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Home Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock identity in localStorage
    await page.goto('/')
    await page.evaluate(() => {
      const identity = {
        state: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: 'Test User',
            createdAt: Date.now(),
          },
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(identity))
    })
  })

  test('redirects to home when identity exists', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/home/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/home/)
  })

  test('displays user profile', async ({ page }) => {
    await page.goto('/home')

    await expect(page.getByText('@Test User')).toBeVisible()
    await expect(page.getByText('0x1234...7890')).toBeVisible()
  })

  test('shows switch account button', async ({ page }) => {
    await page.goto('/home')

    await expect(page.getByRole('button', { name: /Switch Account/i })).toBeVisible()
  })

  test('clears identity and redirects on switch account', async ({ page }) => {
    await page.goto('/home')

    await page.getByRole('button', { name: /Switch Account/i }).click()

    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Mobile Responsiveness', () => {
  test('welcome screen fits mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/onboarding')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeInViewport()
    await expect(page.getByRole('button', { name: /create.*villa id/i })).toBeVisible()
  })

  test('profile screen fits mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await page.evaluate(() => {
      const identity = {
        state: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: 'Test User',
            createdAt: Date.now(),
          },
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(identity))
    })

    await page.goto('/home')
    await expect(page.getByText('@Test User')).toBeVisible()
  })
})
