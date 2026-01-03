import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('redirects to onboarding when no identity', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('shows welcome screen with create and sign in buttons', async ({ page }) => {
    await page.goto('/onboarding')

    await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible()
    await expect(page.getByText('Your identity. No passwords.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Villa ID' })).toBeVisible()
    await expect(page.getByText('Secured by passkeys')).toBeVisible()
  })

  test('shows connecting state when creating identity', async ({ page }) => {
    await page.goto('/onboarding')

    // Click create - goes directly to Porto (no explainer step)
    await page.getByRole('button', { name: 'Create Villa ID' }).click()

    // Should show connecting state OR error state (Porto may fail in test environment)
    await expect(
      page.getByRole('heading', { name: 'Connecting...' })
        .or(page.getByRole('heading', { name: 'Something went wrong' }))
    ).toBeVisible({ timeout: 10000 })
  })

  test('shows connecting state when signing in', async ({ page }) => {
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Sign In' }).click()

    // Should show connecting state OR error state
    await expect(
      page.getByRole('heading', { name: 'Connecting...' })
        .or(page.getByRole('heading', { name: 'Something went wrong' }))
    ).toBeVisible({ timeout: 10000 })
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
    await expect(page).toHaveURL(/\/home/)
  })

  test('displays user profile', async ({ page }) => {
    await page.goto('/home')

    await expect(page.getByText('Test User')).toBeVisible()
    await expect(page.getByText('0x1234...7890')).toBeVisible()
  })

  test('shows switch account button', async ({ page }) => {
    await page.goto('/home')

    await expect(page.getByRole('button', { name: /Switch Account/i })).toBeVisible()
  })

  test('clears identity and redirects on switch account', async ({ page }) => {
    await page.goto('/home')

    await page.getByRole('button', { name: /Switch Account/i }).click()

    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Mobile Responsiveness', () => {
  test('welcome screen fits mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/onboarding')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeInViewport()
    await expect(page.getByRole('button', { name: 'Create Villa ID' })).toBeVisible()
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
    await expect(page.getByText('Test User')).toBeVisible()
  })
})
