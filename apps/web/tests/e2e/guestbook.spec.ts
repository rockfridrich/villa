import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Guestbook Demo
 *
 * Tests the guestbook functionality including:
 * - Authentication requirement
 * - Posting messages
 * - Message display
 * - Message persistence
 * - Character limit
 */

test.describe('Guestbook Demo', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state before each test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('redirects to auth when not signed in', async ({ page }) => {
    await page.goto('/guestbook')

    // Should show auth flow (VillaAuth component)
    await expect(page.getByRole('heading', { name: /your identity/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows guestbook UI when signed in', async ({ page }) => {
    // Mock signed-in user
    await page.goto('/')
    await page.evaluate(() => {
      const mockIdentity = {
        state: {
          identity: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            displayName: 'testuser',
            avatar: {
              style: 'adventurer',
              seed: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            },
            createdAt: Date.now(),
          }
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(mockIdentity))
    })

    await page.goto('/guestbook')

    // Verify guestbook UI elements
    await expect(page.getByRole('heading', { name: /guestbook/i })).toBeVisible()
    await expect(page.getByPlaceholder(/leave a message/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /post/i })).toBeVisible()
    await expect(page.getByText(/signed in as/i)).toBeVisible()
    await expect(page.getByText(/@testuser/i)).toBeVisible()
  })

  test('can post a message', async ({ page }) => {
    // Mock signed-in user
    await page.goto('/')
    await page.evaluate(() => {
      const mockIdentity = {
        state: {
          identity: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            displayName: 'alice',
            avatar: {
              style: 'adventurer',
              seed: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            },
            createdAt: Date.now(),
          }
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(mockIdentity))
    })

    await page.goto('/guestbook')

    // Type a message
    const input = page.getByPlaceholder(/leave a message/i)
    await input.fill('Hello from the guestbook!')

    // Click post button
    await page.getByRole('button', { name: /post/i }).click()

    // Verify message appears in the list
    const messageCard = page.locator('.bg-white').filter({ hasText: 'Hello from the guestbook!' })
    await expect(messageCard.getByText('Hello from the guestbook!')).toBeVisible()
    await expect(messageCard.getByText(/@alice/i)).toBeVisible()
    await expect(messageCard.getByText(/just now/i)).toBeVisible()

    // Verify input is cleared
    await expect(input).toHaveValue('')
  })

  test('enforces character limit', async ({ page }) => {
    // Mock signed-in user
    await page.goto('/')
    await page.evaluate(() => {
      const mockIdentity = {
        state: {
          identity: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            displayName: 'bob',
            avatar: {
              style: 'adventurer',
              seed: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            },
            createdAt: Date.now(),
          }
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(mockIdentity))
    })

    await page.goto('/guestbook')

    const input = page.getByPlaceholder(/leave a message/i)
    const longMessage = 'a'.repeat(300) // More than 280 chars

    await input.fill(longMessage)

    // Input should be truncated to 280 chars
    const value = await input.inputValue()
    expect(value.length).toBeLessThanOrEqual(280)

    // Character counter should show limit
    await expect(page.getByText(/280\/280/i)).toBeVisible()
  })

  test('disables post button when message is empty', async ({ page }) => {
    // Mock signed-in user
    await page.goto('/')
    await page.evaluate(() => {
      const mockIdentity = {
        state: {
          identity: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            displayName: 'charlie',
            avatar: {
              style: 'adventurer',
              seed: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            },
            createdAt: Date.now(),
          }
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(mockIdentity))
    })

    await page.goto('/guestbook')

    const postButton = page.getByRole('button', { name: /post/i })

    // Initially disabled (empty message)
    await expect(postButton).toBeDisabled()

    // Type message - button becomes enabled
    await page.getByPlaceholder(/leave a message/i).fill('Test message')
    await expect(postButton).toBeEnabled()

    // Clear message - button becomes disabled again
    await page.getByPlaceholder(/leave a message/i).fill('')
    await expect(postButton).toBeDisabled()
  })

  test('messages persist in localStorage', async ({ page }) => {
    // Mock signed-in user
    await page.goto('/')
    await page.evaluate(() => {
      const mockIdentity = {
        state: {
          identity: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            displayName: 'dave',
            avatar: {
              style: 'adventurer',
              seed: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            },
            createdAt: Date.now(),
          }
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(mockIdentity))
    })

    await page.goto('/guestbook')

    // Post a message
    await page.getByPlaceholder(/leave a message/i).fill('Persistent message')
    await page.getByRole('button', { name: /post/i }).click()

    // Verify message appears
    await expect(page.getByText('Persistent message')).toBeVisible()

    // Reload page
    await page.reload()

    // Message should still be visible
    await expect(page.getByText('Persistent message')).toBeVisible()
  })

  test('shows empty state when no messages', async ({ page }) => {
    // Mock signed-in user
    await page.goto('/')
    await page.evaluate(() => {
      const mockIdentity = {
        state: {
          identity: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            displayName: 'eve',
            avatar: {
              style: 'adventurer',
              seed: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            },
            createdAt: Date.now(),
          }
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(mockIdentity))
    })

    await page.goto('/guestbook')

    // Should show empty state
    await expect(page.getByText(/no messages yet/i)).toBeVisible()
    await expect(page.getByText(/be the first to sign/i)).toBeVisible()
  })

  test('can post message with Enter key', async ({ page }) => {
    // Mock signed-in user
    await page.goto('/')
    await page.evaluate(() => {
      const mockIdentity = {
        state: {
          identity: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            displayName: 'frank',
            avatar: {
              style: 'adventurer',
              seed: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            },
            createdAt: Date.now(),
          }
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(mockIdentity))
    })

    await page.goto('/guestbook')

    // Type message and press Enter
    const input = page.getByPlaceholder(/leave a message/i)
    await input.fill('Posted with Enter key')
    await input.press('Enter')

    // Verify message appears
    await expect(page.getByText('Posted with Enter key')).toBeVisible()
  })
})
