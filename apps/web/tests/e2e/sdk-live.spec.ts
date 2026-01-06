/**
 * SDK Live Integration Test
 *
 * Tests the actual SDK iframe flow on the deployed environment.
 */

import { test, expect } from '@playwright/test'

test.describe('SDK Live - Demo Page', () => {
  test('SDK demo page loads and shows sign in button', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Page should load
    await expect(page).toHaveTitle(/Villa/)

    // Should have sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await expect(signInButton.first()).toBeVisible({ timeout: 10000 })
  })

  test('clicking sign in opens VillaAuth modal', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Click sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await signInButton.first().click()

    // Should see VillaAuth modal appear (not iframe - it's a local component)
    // The modal contains the VillaAuth component which shows welcome screen
    await expect(page.locator('text=/create.*villa.*id|welcome/i').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('SDK Live - Iframe Test Page', () => {
  test('iframe test page loads', async ({ page }) => {
    await page.goto('/sdk-demo/iframe-test')

    // Page should show "Open Auth Iframe" button
    const openButton = page.getByRole('button', { name: /open auth iframe/i })
    await expect(openButton).toBeVisible({ timeout: 10000 })
  })

  test('clicking button opens auth iframe', async ({ page }) => {
    await page.goto('/sdk-demo/iframe-test')

    // Click the open auth iframe button
    const openButton = page.getByRole('button', { name: /open auth iframe/i })
    await openButton.click()

    // Should see auth iframe appear
    const iframe = page.locator('iframe[src*="/auth"]')
    await expect(iframe).toBeVisible({ timeout: 10000 })

    // Iframe should have correct permissions for passkeys
    const allow = await iframe.getAttribute('allow')
    expect(allow).toContain('publickey-credentials')
  })

  test('auth page loads in iframe with correct content', async ({ page }) => {
    await page.goto('/sdk-demo/iframe-test')

    // Click the open auth iframe button
    const openButton = page.getByRole('button', { name: /open auth iframe/i })
    await openButton.click()

    // Wait for iframe
    const iframe = page.locator('iframe[src*="/auth"]')
    await expect(iframe).toBeVisible({ timeout: 10000 })

    // Get iframe content
    const frame = page.frameLocator('iframe[src*="/auth"]')

    // Should show Villa branding or auth options
    const villaContent = frame.locator('text=/villa|sign in|create/i')
    await expect(villaContent.first()).toBeVisible({ timeout: 15000 })
  })

  test('postMessage logs are displayed', async ({ page }) => {
    await page.goto('/sdk-demo/iframe-test')

    // Click the open auth iframe button
    const openButton = page.getByRole('button', { name: /open auth iframe/i })
    await openButton.click()

    // Should see logs appear in the log panel
    await expect(page.locator('text=/opening auth iframe/i')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('SDK Demo - Live/Mock Toggle', () => {
  test('shows Mock mode by default', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Mock toggle should be visible and show "Mock"
    const mockToggle = page.getByRole('button', { name: /mock/i })
    await expect(mockToggle).toBeVisible({ timeout: 10000 })
  })

  test('can toggle to Live mode', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Click Mock toggle to switch to Live
    const mockToggle = page.getByRole('button', { name: /mock/i })
    await mockToggle.click()

    // Should now show "Live"
    const liveToggle = page.getByRole('button', { name: /live/i })
    await expect(liveToggle).toBeVisible()
  })

  test('error simulation toggle is available', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Error simulation button should be visible
    const errorToggle = page.getByRole('button', { name: /errors/i })
    await expect(errorToggle).toBeVisible({ timeout: 10000 })
  })

  test('query user in mock mode returns mock data', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Navigate to Query section
    const queryButton = page.getByRole('button', { name: /query/i })
    await queryButton.click()

    // Enter a nickname
    const input = page.getByPlaceholder(/nickname/i)
    await input.fill('testuser')

    // Click query button
    const searchButton = page.getByRole('button', { name: /query/i }).last()
    await searchButton.click()

    // Should see result with mock data indicator in logs
    await expect(page.locator('text=/testuser/i')).toBeVisible({ timeout: 5000 })
    // Log should show "mock" source
    await expect(page.locator('text=/mock/i')).toBeVisible()
  })

  test('ENS resolution in mock mode works', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Navigate to ENS section
    const ensButton = page.getByRole('button', { name: /ens/i })
    await ensButton.click()

    // Enter an ENS name in the input field
    const input = page.locator('input[placeholder*="alice"]')
    await input.fill('alice')

    // Click resolve button
    const resolveButton = page.getByRole('button', { name: /resolve/i })
    await resolveButton.click()

    // Should see the method call logged
    await expect(page.locator('text=villa.resolveENS(name)')).toBeVisible({ timeout: 5000 })
    // Should see successful result with green styling (contains dnssec: true)
    await expect(page.locator('.bg-green-50')).toBeVisible()
  })

  test('error simulation shows error in logs', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Enable error simulation
    const errorToggle = page.getByRole('button', { name: /errors/i })
    await errorToggle.click()

    // Navigate to Query section
    const queryButton = page.getByRole('button', { name: /query/i })
    await queryButton.click()

    // Enter a nickname and query
    const input = page.locator('input[placeholder*="nickname"]')
    await input.fill('testuser')
    const searchButton = page.locator('button:has-text("Query")').last()
    await searchButton.click()

    // Should see error styling in logs (red background on error)
    await expect(page.locator('.bg-red-50, .bg-red-100, .border-red-300').first()).toBeVisible({ timeout: 5000 })
  })
})

// These API tests require a database connection - they run in CI but may timeout locally
test.describe('ENS API Resolution', () => {
  // Skip DB-dependent tests when running locally (no DATABASE_URL)
  // They will run in CI where database is available
  test.skip(({ browserName }) => !process.env.DATABASE_URL && browserName === 'chromium', 'Requires DATABASE_URL')

  test('GET /api/nicknames/check returns availability', async ({ request }) => {
    const response = await request.get('/api/nicknames/check/testnickname12345')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('available')
    expect(data).toHaveProperty('normalized')
  })

  test('GET /api/nicknames/check validates short nicknames', async ({ request }) => {
    const response = await request.get('/api/nicknames/check/ab')
    const data = await response.json()

    // Short nickname should be invalid
    expect(data.available).toBeFalsy()
    expect(data.error).toContain('at least 3')
  })

  test('GET /api/nicknames/check blocks reserved names', async ({ request }) => {
    const response = await request.get('/api/nicknames/check/admin')
    const data = await response.json()

    // Reserved name should not be available
    expect(data.available).toBeFalsy()
    expect(data.reason).toBe('invalid')
  })

  test('GET /api/nicknames/reverse returns 404 for unknown address', async ({ request }) => {
    const response = await request.get('/api/nicknames/reverse/0x0000000000000000000000000000000000000000')
    expect(response.status()).toBe(404)
  })
})

test.describe('API Health', () => {
  test('API health check responds', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('status', 'ok')
    expect(data).toHaveProperty('timestamp')
  })
})

test.describe('CCIP-Read ENS Gateway', () => {
  test('POST /api/ens/resolve handles request without name', async ({ request }) => {
    const response = await request.post('/api/ens/resolve', {
      data: {
        sender: '0x0000000000000000000000000000000000000000',
        data: '0x3b3b57de0000000000000000000000000000000000000000000000000000000000000000'
      }
    })

    // Should return 400 for missing name
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('POST /api/ens/resolve returns encoded address for known nickname', async ({ request }) => {
    // Skip if no DATABASE_URL (requires DB to look up nickname)
    if (!process.env.DATABASE_URL) {
      test.skip()
      return
    }

    // Use hex-encoded DNS name for "testuser.villa.cash"
    const dnsName = '0x0874657374757365720576696c6c610463617368' + '00'

    const response = await request.post('/api/ens/resolve', {
      data: {
        sender: '0x0000000000000000000000000000000000000000',
        data: '0x3b3b57de0000000000000000000000000000000000000000000000000000000000000000',
        extraData: dnsName
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('data')
    // Response should be hex-encoded
    expect(data.data).toMatch(/^0x/)
  })
})

test.describe('Profile Nickname Edit API', () => {
  // Skip DB-dependent tests when running locally
  test.skip(() => !process.env.DATABASE_URL, 'Requires DATABASE_URL')

  test('PATCH /api/profile validates nickname format', async ({ request }) => {
    const response = await request.patch('/api/profile', {
      data: {
        address: '0x0000000000000000000000000000000000000001',
        newNickname: 'ab' // Too short
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('at least 3')
  })

  test('PATCH /api/profile rejects invalid address', async ({ request }) => {
    const response = await request.patch('/api/profile', {
      data: {
        address: 'invalid-address',
        newNickname: 'validnickname'
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid address')
  })

  test('PATCH /api/profile returns 404 for non-existent profile', async ({ request }) => {
    const response = await request.patch('/api/profile', {
      data: {
        address: '0x0000000000000000000000000000000000000001',
        newNickname: 'validnickname'
      }
    })

    expect(response.status()).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })
})
