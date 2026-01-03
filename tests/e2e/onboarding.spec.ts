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

  test('shows welcome screen with get started button', async ({ page }) => {
    await page.goto('/onboarding')

    await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible()
    await expect(page.getByText('Your identity. No passwords.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })

  test('navigates to explainer on get started click', async ({ page }) => {
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Get Started' }).click()

    await expect(page.getByText('Secure & Simple')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Identity' })).toBeVisible()
  })

  test('shows connecting state when creating identity', async ({ page }) => {
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Get Started' }).click()
    await page.getByRole('button', { name: 'Create Identity' }).click()

    // Should show connecting state OR error state (Porto may fail without HTTPS)
    // This validates the flow progresses past the explainer
    await expect(
      page.getByRole('heading', { name: 'Creating Identity...' })
        .or(page.getByRole('heading', { name: 'Something went wrong' }))
    ).toBeVisible()
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

  test('shows sign out button', async ({ page }) => {
    await page.goto('/home')

    await expect(page.getByRole('button', { name: /Sign Out/i })).toBeVisible()
  })

  test('clears identity and redirects on sign out', async ({ page }) => {
    await page.goto('/home')

    await page.getByRole('button', { name: /Sign Out/i }).click()

    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Mobile Responsiveness', () => {
  test('welcome screen fits mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/onboarding')

    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeInViewport()
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
