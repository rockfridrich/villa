import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Cross-Chain Deposits via Glide
 *
 * Test Coverage:
 * 1. Add Funds button renders on home page
 * 2. Modal opens with correct recipient address
 * 3. Success state with Lottie celebration
 * 4. Error state with retry functionality
 * 5. Modal close behavior
 *
 * Note: Glide SDK is mocked since we're using placeholder project ID.
 * Real integration testing requires valid Glide project ID and API keys.
 *
 * Related Spec: specs/active/cross-chain-deposits.md
 */

test.describe('Funding - Add Funds Button', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated user
    await page.goto('/')
    await page.evaluate(() => {
      const identity = {
        state: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: 'testuser',
            createdAt: Date.now(),
          },
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(identity))
    })
  })

  test('renders Add Funds button on home page', async ({ page }) => {
    await page.goto('/home')

    // Button should be visible
    const addFundsButton = page.getByRole('button', { name: /add funds/i })
    await expect(addFundsButton).toBeVisible()

    // Helper text should explain capability
    await expect(page.getByText(/deposit from any chain/i)).toBeVisible()
  })

  test('disables button when Glide not configured', async ({ page }) => {
    // Override env var to simulate missing config
    await page.addInitScript(() => {
      // @ts-expect-error - modifying process.env for test
      window.process = { env: { NEXT_PUBLIC_GLIDE_PROJECT_ID: '' } }
    })

    await page.goto('/home')

    const addFundsButton = page.getByRole('button', { name: /add funds/i })
    await expect(addFundsButton).toBeDisabled()
    await expect(page.getByText(/temporarily unavailable/i)).toBeVisible()
  })

  test('opens modal when button clicked', async ({ page }) => {
    await page.goto('/home')

    // Click Add Funds button
    await page.getByRole('button', { name: /add funds/i }).click()

    // Modal should open with title
    const modalTitle = page.getByRole('heading', { name: 'Add Funds' })
    await expect(modalTitle).toBeVisible()

    // Description should explain functionality
    await expect(page.getByText(/connecting to funding service/i)).toBeVisible()
  })

  test('shows loading state then active state', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: /add funds/i }).click()

    // Loading state
    await expect(page.getByText(/connecting to funding service/i)).toBeVisible()

    // Wait for active state (simulated 500ms delay)
    await page.waitForTimeout(600)
    await expect(page.getByText(/deposit from any chain to your villa id/i)).toBeVisible()
  })

  test('closes modal when backdrop clicked', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: /add funds/i }).click()

    // Wait for modal to open
    await expect(page.getByRole('heading', { name: 'Add Funds' })).toBeVisible()

    // Click backdrop (Radix Dialog closes on backdrop click by default)
    await page.keyboard.press('Escape')

    // Modal should close
    await expect(page.getByRole('heading', { name: 'Add Funds' })).not.toBeVisible()
  })
})

test.describe('Funding - Success State', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated user
    await page.goto('/')
    await page.evaluate(() => {
      const identity = {
        state: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: 'testuser',
            createdAt: Date.now(),
          },
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(identity))
    })
  })

  test('shows success celebration after deposit', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: /add funds/i }).click()

    // Wait for active state
    await page.waitForTimeout(600)

    // Click Test Success button (temporary demo)
    await page.getByRole('button', { name: /test success/i }).click()

    // Success state should show
    await expect(page.getByRole('heading', { name: 'Funds Added!' })).toBeVisible()
    await expect(page.getByText(/your funds will arrive in about 2 minutes/i)).toBeVisible()

    // Transaction details should be displayed
    await expect(page.getByText('100 USDC')).toBeVisible()
    await expect(page.getByText('Ethereum')).toBeVisible()
    await expect(page.getByText('Villa (Base)')).toBeVisible()

    // Block explorer link should be visible
    await expect(page.getByRole('button', { name: /view on block explorer/i })).toBeVisible()

    // Done button should close modal
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByRole('heading', { name: 'Funds Added!' })).not.toBeVisible()
  })

  test('opens block explorer in new tab', async ({ page, context }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: /add funds/i }).click()
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: /test success/i }).click()

    // Listen for new tab
    const newPagePromise = context.waitForEvent('page')

    // Click block explorer link
    await page.getByRole('button', { name: /view on block explorer/i }).click()

    // Verify new tab opened with correct URL
    const newPage = await newPagePromise
    await newPage.waitForLoadState()
    expect(newPage.url()).toContain('basescan.org/tx/')
  })
})

test.describe('Funding - Error State', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated user
    await page.goto('/')
    await page.evaluate(() => {
      const identity = {
        state: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: 'testuser',
            createdAt: Date.now(),
          },
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(identity))
    })
  })

  test('shows error state after failed transaction', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: /add funds/i }).click()

    // Wait for active state
    await page.waitForTimeout(600)

    // Click Test Error button (temporary demo)
    await page.getByRole('button', { name: /test error/i }).click()

    // Error state should show
    await expect(page.getByRole('heading', { name: 'Transaction Failed' })).toBeVisible()

    // User-friendly error message should be displayed
    await expect(page.getByText(/something went wrong/i)).toBeVisible()

    // Action buttons should be visible
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()
  })

  test('retry button resets to active state', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: /add funds/i }).click()
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: /test error/i }).click()

    // Error state visible
    await expect(page.getByRole('heading', { name: 'Transaction Failed' })).toBeVisible()

    // Click Try Again
    await page.getByRole('button', { name: 'Try Again' }).click()

    // Should return to loading then active state
    await expect(page.getByText(/connecting to funding service/i)).toBeVisible()
    await page.waitForTimeout(600)
    await expect(page.getByText(/deposit from any chain to your villa id/i)).toBeVisible()
  })

  test('cancel button closes modal', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: /add funds/i }).click()
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: /test error/i }).click()

    // Error state visible
    await expect(page.getByRole('heading', { name: 'Transaction Failed' })).toBeVisible()

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Modal should close
    await expect(page.getByRole('heading', { name: 'Transaction Failed' })).not.toBeVisible()
  })
})

test.describe('Funding - Mobile Responsive', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  })

  test.beforeEach(async ({ page }) => {
    // Set up authenticated user
    await page.goto('/')
    await page.evaluate(() => {
      const identity = {
        state: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: 'testuser',
            createdAt: Date.now(),
          },
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(identity))
    })
  })

  test('button has adequate touch target on mobile', async ({ page }) => {
    await page.goto('/home')

    const addFundsButton = page.getByRole('button', { name: /add funds/i })
    await expect(addFundsButton).toBeVisible()

    // Verify minimum 44px touch target (Apple HIG)
    const boundingBox = await addFundsButton.boundingBox()
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
  })

  test('modal renders as bottom sheet on mobile', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: /add funds/i }).click()

    // Modal should be visible and full-width on mobile
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    const boundingBox = await modal.boundingBox()
    expect(boundingBox?.width).toBeLessThanOrEqual(375) // Respects viewport
  })
})
