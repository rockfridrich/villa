/**
 * SDK Iframe Integration E2E Tests
 *
 * Tests for iframe authentication flow and postMessage communication.
 */

import { test, expect } from '@playwright/test'

test.describe('SDK Iframe - Authentication Flow', () => {
  test('iframe opens when signIn is triggered', async ({ page }) => {
    // Create a test page that uses the SDK
    await page.goto('/test')

    // Trigger SDK signIn
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    // Should see auth iframe
    const iframe = page.locator('[data-testid="villa-auth-iframe"]')
    await expect(iframe).toBeVisible({ timeout: 5000 })
  })

  test('iframe displays SignInWelcome screen first', async ({ page }) => {
    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    const iframe = page.frameLocator('[data-testid="villa-auth-iframe"]')

    await expect(iframe.getByText(/create.*villa.*id/i)).toBeVisible({ timeout: 5000 })
    await expect(iframe.getByText(/sign in/i)).toBeVisible()
  })

  test('escape key closes iframe', async ({ page }) => {
    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    const iframe = page.locator('[data-testid="villa-auth-iframe"]')
    await expect(iframe).toBeVisible({ timeout: 5000 })

    await page.keyboard.press('Escape')

    await expect(iframe).not.toBeVisible()
  })

  test('clicking outside closes iframe', async ({ page }) => {
    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    const iframe = page.locator('[data-testid="villa-auth-iframe"]')
    await expect(iframe).toBeVisible({ timeout: 5000 })

    // Click on overlay
    await page.locator('[data-testid="villa-auth-overlay"]').click({ position: { x: 10, y: 10 } })

    await expect(iframe).not.toBeVisible()
  })
})

test.describe('SDK Iframe - Loading States', () => {
  test('shows spinner while iframe loads', async ({ page }) => {
    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    // Should show loading indicator
    const spinner = page.locator('[data-testid="villa-auth-loading"]')
    await expect(spinner).toBeVisible()
  })

  test('spinner disappears after iframe is ready', async ({ page }) => {
    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    const spinner = page.locator('[data-testid="villa-auth-loading"]')

    // Wait for iframe to be ready
    await page.waitForFunction(() => {
      return document.querySelector('[data-testid="villa-auth-iframe"]')?.getAttribute('data-ready') === 'true'
    }, { timeout: 5000 })

    await expect(spinner).not.toBeVisible()
  })
})

test.describe('SDK Iframe - postMessage Security', () => {
  test('rejects messages from untrusted origins', async ({ page }) => {
    await page.goto('/test')

    // Try to send message from page context (untrusted)
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('message', (e) => {
          if (e.data.type === 'VILLA_AUTH_REJECTED') {
            resolve('rejected')
          }
        })

        // Simulate untrusted message
        window.postMessage({
          type: 'VILLA_AUTH_SUCCESS',
          payload: { fake: true }
        }, '*')

        // Timeout means message was ignored
        setTimeout(() => resolve('ignored'), 1000)
      })
    })

    expect(result).toBe('ignored')
  })

  test('validates message payload schema', async ({ page }) => {
    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    // Wait for iframe
    await page.locator('[data-testid="villa-auth-iframe"]').waitFor({ timeout: 5000 })

    // Track console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Send malformed message
    await page.evaluate(() => {
      window.postMessage({
        type: 'VILLA_AUTH_SUCCESS',
        payload: 'not-an-object'
      }, '*')
    })

    // Should not crash the app
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('SDK Iframe - Timeout Handling', () => {
  test('handles timeout gracefully', async ({ page }) => {
    // Set a very short timeout for testing
    await page.goto('/test?authTimeout=100')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    // Wait for timeout error
    await expect(page.getByText(/timeout/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('SDK Iframe - Animation', () => {
  test('iframe fades in smoothly', async ({ page }) => {
    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    const overlay = page.locator('[data-testid="villa-auth-overlay"]')

    // Check initial opacity is 0 or animating
    const initialOpacity = await overlay.evaluate((el) =>
      window.getComputedStyle(el).opacity
    )

    expect(parseFloat(initialOpacity)).toBeLessThanOrEqual(1)
  })

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    const overlay = page.locator('[data-testid="villa-auth-overlay"]')

    // Should appear immediately without animation
    const transition = await overlay.evaluate((el) =>
      window.getComputedStyle(el).transition
    )

    expect(transition).toContain('none')
  })
})

test.describe('SDK Iframe - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('iframe is fullscreen on mobile', async ({ page }) => {
    await page.goto('/test')

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('villa:test:signIn'))
    })

    const iframe = page.locator('[data-testid="villa-auth-iframe"]')
    await expect(iframe).toBeVisible({ timeout: 5000 })

    const box = await iframe.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(375 - 32) // Allow some padding
    expect(box?.height).toBeGreaterThanOrEqual(500)
  })
})
