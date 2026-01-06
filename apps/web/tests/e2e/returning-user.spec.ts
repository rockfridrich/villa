import { test, expect } from '@playwright/test'

test.describe('Returning User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test.describe('Same Device (identity in localStorage)', () => {
    test('redirects to home when complete identity exists', async ({ page }) => {
      // Set up mock identity with avatar
      await page.evaluate(() => {
        const identity = {
          state: {
            identity: {
              address: '0x1234567890123456789012345678901234567890',
              displayName: 'alice',
              avatar: {
                style: 'avataaars',
                selection: 'female',
                variant: 5,
              },
              createdAt: Date.now(),
            },
          },
          version: 0,
        }
        localStorage.setItem('villa-identity', JSON.stringify(identity))
      })

      await page.goto('/onboarding')
      await page.waitForURL(/\/home/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/home/)
    })

    test('shows avatar on home page for returning user', async ({ page }) => {
      // Set up mock identity with avatar
      await page.evaluate(() => {
        const identity = {
          state: {
            identity: {
              address: '0x1234567890123456789012345678901234567890',
              displayName: 'alice',
              avatar: {
                style: 'avataaars',
                selection: 'female',
                variant: 5,
              },
              createdAt: Date.now(),
            },
          },
          version: 0,
        }
        localStorage.setItem('villa-identity', JSON.stringify(identity))
      })

      await page.goto('/home')
      await expect(page.getByText('@alice')).toBeVisible()
    })
  })

  test.describe('New Device (nickname on API, no localStorage)', () => {
    // Note: These tests use URL params to simulate test mode
    // In production, the sign-in flow queries the API for nickname

    test('shows welcome-back step with nickname', async ({ page }) => {
      // Direct navigation to welcome-back step (simulates API response)
      await page.goto('/onboarding?step=welcome-back&address=0x1234567890123456789012345678901234567890&displayName=alice')

      await expect(page.getByRole('heading', { name: 'Welcome back, @alice!' })).toBeVisible()
      await expect(page.getByText("Let's set up your look on this device")).toBeVisible()
    })

    test('welcome-back step auto-advances to avatar selection', async ({ page }) => {
      // Navigate to welcome-back step
      await page.goto('/onboarding?step=welcome-back&address=0x1234567890123456789012345678901234567890&displayName=alice')

      // Wait for auto-advance (2 seconds)
      await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible({ timeout: 5000 })
    })

    test('avatar selection works after welcome-back', async ({ page }) => {
      // Navigate directly to avatar step (simulates welcome-back auto-advance)
      await page.goto('/onboarding?step=avatar&address=0x1234567890123456789012345678901234567890&displayName=alice')

      // Should show avatar selection
      await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()
      // Style buttons have avatar previews inside, check by exact text match
      await expect(page.getByText('Female', { exact: true })).toBeVisible()
      await expect(page.getByText('Male', { exact: true })).toBeVisible()
      await expect(page.getByText('Other', { exact: true })).toBeVisible()
    })

    test('completing avatar saves identity and redirects to home', async ({ page }) => {
      // Navigate to avatar step with displayName already set
      await page.goto('/onboarding?step=avatar&address=0x1234567890123456789012345678901234567890&displayName=alice')

      // Click Select button
      const selectButton = page.getByRole('button', { name: 'Select' })
      await selectButton.click()

      // Wait for celebration
      await expect(page.getByRole('heading', { name: 'Perfect!' })).toBeVisible()

      // Should redirect to home
      await page.waitForURL(/\/home/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/home/)

      // Verify identity was saved
      await expect(page.getByText('@alice')).toBeVisible()
    })
  })

  test.describe('URL Parameter Testing (Direct Step Navigation)', () => {
    test('can navigate directly to profile step', async ({ page }) => {
      await page.goto('/onboarding?step=profile&address=0x1234')

      await expect(page.getByRole('heading', { name: 'Choose your @handle' })).toBeVisible()
    })

    test('can navigate directly to avatar step', async ({ page }) => {
      await page.goto('/onboarding?step=avatar&address=0x1234&displayName=testuser')

      await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()
    })

    test('can navigate directly to success step', async ({ page }) => {
      await page.goto('/onboarding?step=success&address=0x1234')

      await expect(page.getByRole('heading', { name: 'Connected!' })).toBeVisible()
    })
  })
})

test.describe('Nickname API Integration', () => {
  // These tests verify the UI handles API responses correctly
  // They don't test actual API calls (those are integration tests)

  test('new user sees profile step (no nickname found)', async ({ page }) => {
    // Without displayName in URL params, profile step should require input
    await page.goto('/onboarding?step=profile&address=0x1234')

    await expect(page.getByPlaceholder('yourname')).toBeVisible()
    await expect(page.getByRole('button', { name: /Claim @/i })).toBeDisabled()
  })

  test('profile step validates input before proceeding', async ({ page }) => {
    await page.goto('/onboarding?step=profile&address=0x1234567890123456789012345678901234567890')

    // Button should be disabled when empty
    await expect(page.getByRole('button', { name: /Claim @/i })).toBeDisabled()

    // Enter just spaces (button should remain disabled - trimmed input is empty)
    await page.getByPlaceholder('yourname').fill('   ')
    await expect(page.getByRole('button', { name: /Claim @/i })).toBeDisabled()

    // Should stay on profile step
    await expect(page.getByRole('heading', { name: 'Choose your @handle' })).toBeVisible()
  })

  test('profile step proceeds to avatar with valid input', async ({ page }) => {
    await page.goto('/onboarding?step=profile&address=0x1234567890123456789012345678901234567890')

    // Enter valid name
    await page.getByPlaceholder('yourname').fill('validuser')
    await page.getByRole('button', { name: 'Claim @validuser' }).click()

    // Should proceed to avatar
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()
  })
})
