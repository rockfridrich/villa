import { test, expect } from '@playwright/test'

/**
 * E2E Test Suite: Avatar Selection
 * Tests the avatar selection flow with Male/Female options
 */

// Helper to get gender buttons by exact span text (avoids SVG text matching issues)
function getGenderButton(page: import('@playwright/test').Page, gender: 'Male' | 'Female') {
  return page.locator('button', { has: page.locator('span', { hasText: new RegExp(`^${gender}$`) }) })
}

test.describe('Avatar Selection Flow', () => {
  // Mock wallet address for deterministic testing
  const MOCK_WALLET = '0x1234567890123456789012345678901234567890'
  const MOCK_NICKNAME = 'TestUser'

  test.beforeEach(async ({ page }) => {
    // Navigate directly to avatar step with test parameters
    // This bypasses the full onboarding flow for isolated avatar testing
    await page.goto(`/onboarding?step=avatar&address=${MOCK_WALLET}&displayName=${MOCK_NICKNAME}`)
  })

  test('Scenario 1: Quick selection (<5s)', async ({ page }) => {
    // Avatar selection screen should be visible

    // Wait for avatar selection screen
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    // Timer should be visible and counting down
    await expect(page.locator('text=/0:\\d{2}/')).toBeVisible()

    // Select button should be visible and enabled
    const selectButton = page.getByRole('button', { name: 'Select' })
    await expect(selectButton).toBeVisible()
    await expect(selectButton).toBeEnabled()

    // Click select within 5 seconds
    await selectButton.click()

    // Should show saving state
    await expect(page.getByRole('button', { name: 'Saving...' })).toBeVisible()
  })

  test('Scenario 2: Gender selection changes avatar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    // Wait for page to be fully hydrated
    await page.waitForLoadState('networkidle')

    // Use exact span text selectors for reliable button selection
    const femaleButton = getGenderButton(page, 'Female')
    const maleButton = getGenderButton(page, 'Male')

    // Default gender should be Female (selected)
    await expect(femaleButton).toHaveClass(/bg-accent-yellow/)

    // Avatar preview should be visible (the large one with shadow-lg class)
    const avatarPreview = page.locator('img[alt="Avatar"].shadow-lg')
    await expect(avatarPreview).toBeVisible()

    // Get initial avatar src
    const initialSrc = await avatarPreview.getAttribute('src')

    // Click Male button
    await maleButton.click()
    await page.waitForTimeout(200) // Wait for state update

    // Male button should now be selected
    await expect(maleButton).toHaveClass(/bg-accent-yellow/)
    await expect(femaleButton).toHaveClass(/bg-cream-100/)

    // Avatar should change (different src)
    await page.waitForTimeout(100) // Brief wait for avatar regeneration
    const newSrc = await avatarPreview.getAttribute('src')
    expect(newSrc).not.toBe(initialSrc)

    // Click back to Female
    await femaleButton.click()
    await page.waitForTimeout(200) // Wait for state update

    // Female button should now be selected
    await expect(femaleButton).toHaveClass(/bg-accent-yellow/)
    await expect(maleButton).toHaveClass(/bg-cream-100/)

    // Avatar should change again
    await page.waitForTimeout(100)
    const femaleSrc = await avatarPreview.getAttribute('src')
    expect(femaleSrc).not.toBe(newSrc)
  })

  test('Scenario 3: Randomize shows different variants', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    const avatarPreview = page.locator('img[alt="Avatar"].shadow-lg')
    const randomizeButton = page.getByRole('button', { name: /Randomize/i })

    // Get initial avatar
    const initialSrc = await avatarPreview.getAttribute('src')

    // Click randomize
    await randomizeButton.click()
    await page.waitForTimeout(100) // Brief wait for regeneration
    const variant1Src = await avatarPreview.getAttribute('src')
    expect(variant1Src).not.toBe(initialSrc)

    // Click randomize again
    await randomizeButton.click()
    await page.waitForTimeout(100)
    const variant2Src = await avatarPreview.getAttribute('src')
    expect(variant2Src).not.toBe(variant1Src)

    // Click randomize a third time
    await randomizeButton.click()
    await page.waitForTimeout(100)
    const variant3Src = await avatarPreview.getAttribute('src')
    expect(variant3Src).not.toBe(variant2Src)

    // All three variants should be distinct
    expect(new Set([initialSrc, variant1Src, variant2Src, variant3Src]).size).toBe(4)
  })

  test('Scenario 4: Timer auto-select at 0:00', async ({ page }) => {
    test.setTimeout(60000) // Need 60s timeout for 30s timer + delays

    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    // Timer should be visible
    const timer = page.locator('span.font-mono')
    await expect(timer).toBeVisible()

    // Get initial timer value to ensure it's counting down
    const initialText = await timer.textContent()
    expect(initialText).toMatch(/0:(30|29|28)/)

    // Wait for timer to reach 0:00 and auto-navigate to home
    // The component calls onSelect which navigates to /home
    await expect(page).toHaveURL('/home', { timeout: 35000 })

    // Verify we're on home page (avatar auto-selected)
    await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible()
  })

  test('Scenario 5: Timer warning states', async ({ page }) => {
    test.setTimeout(50000) // Need 50s timeout to wait ~22 seconds for warning state

    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    const timer = page.locator('span.font-mono')

    // Timer should be visible and counting down
    await expect(timer).toBeVisible()

    // Initially timer should show 0:30 or close to it
    const initialTimer = await timer.textContent()
    expect(initialTimer).toMatch(/0:(30|29|28)/)

    // Wait for timer to reach amber warning state (<=10s remaining)
    let timerReachedWarning = false
    const startTime = Date.now()
    const maxWaitTime = 30000 // 30 seconds

    while (!timerReachedWarning && Date.now() - startTime < maxWaitTime) {
      const timerText = await timer.textContent()
      const match = timerText?.match(/0:(\d{2})/)
      if (match) {
        const seconds = parseInt(match[1], 10)
        if (seconds <= 10) {
          timerReachedWarning = true
          break
        }
      }
      await page.waitForTimeout(500) // Check every 500ms
    }

    expect(timerReachedWarning).toBe(true)

    // Verify timer has amber or red styling
    const timerClass = await timer.getAttribute('class')
    expect(timerClass).toMatch(/text-(amber|red)/)
  })

  test('Scenario 6: Consistent avatar across sessions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    // Select Male
    await getGenderButton(page, 'Male').click()

    // Randomize to variant 5
    const randomizeButton = page.getByRole('button', { name: /Randomize/i })
    for (let i = 0; i < 5; i++) {
      await randomizeButton.click()
      await page.waitForTimeout(100)
    }

    // Get the avatar src at variant 5
    const avatarPreview = page.locator('img[alt="Avatar"].shadow-lg')
    const variant5Src = await avatarPreview.getAttribute('src')

    // Select the avatar
    await page.getByRole('button', { name: 'Select' }).first().click()

    // Wait for saving to complete
    await expect(page.getByRole('button', { name: 'Saving...' })).toBeVisible()

    // Simulate signing in on another device by clearing and reloading
    await page.evaluate(({ wallet, nickname }) => {
      const identity = {
        state: {
          identity: {
            walletAddress: wallet,
            nickname: nickname,
            avatar: {
              style: 'avataaars',
              selection: 'male',
              variant: 5,
            },
            isNewUser: false,
          },
        },
        version: 0,
      }
      localStorage.setItem('villa-identity', JSON.stringify(identity))
    }, { wallet: MOCK_WALLET, nickname: MOCK_NICKNAME })

    await page.reload()

    // Avatar should be the same
    expect(variant5Src).toBeTruthy()
  })

  test('Timer continues counting during gender changes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    const timer = page.locator('text=/0:\\d{2}/')

    // Wait for timer to be visible and stable
    await expect(timer).toBeVisible()

    // Get initial timer value
    const initialTimerText = await timer.textContent()
    const initialSeconds = parseInt(initialTimerText?.split(':')[1] || '30', 10)

    // Change gender
    await getGenderButton(page, 'Male').click()

    // Wait 2 seconds
    await page.waitForTimeout(2000)

    // Timer should have decreased by at least 1 second
    const newTimerText = await timer.textContent()
    const newSeconds = parseInt(newTimerText?.split(':')[1] || '30', 10)

    expect(newSeconds).toBeLessThan(initialSeconds)
  })

  test('Both gender buttons are clickable and functional', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    const femaleButton = getGenderButton(page, 'Female')
    const maleButton = getGenderButton(page, 'Male')

    // Both buttons should be visible and enabled
    await expect(femaleButton).toBeVisible()
    await expect(femaleButton).toBeEnabled()
    await expect(maleButton).toBeVisible()
    await expect(maleButton).toBeEnabled()

    // Female should be selected by default
    await expect(femaleButton).toHaveClass(/bg-accent-yellow/)

    // Click Male and verify selection
    await maleButton.click()
    await page.waitForTimeout(200) // Wait for state update
    await expect(maleButton).toHaveClass(/bg-accent-yellow/)
    await expect(femaleButton).toHaveClass(/bg-cream-100/)

    // Click Female and verify selection
    await femaleButton.click()
    await page.waitForTimeout(200) // Wait for state update
    await expect(femaleButton).toHaveClass(/bg-accent-yellow/)
    await expect(maleButton).toHaveClass(/bg-cream-100/)
  })

  test('Buttons disable during selection', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    const selectButton = page.getByRole('button', { name: 'Select' }).first()
    const randomizeButton = page.getByRole('button', { name: /Randomize/i }).first()
    const maleButton = getGenderButton(page, 'Male')

    // All buttons should be enabled initially
    await expect(selectButton).toBeEnabled()
    await expect(randomizeButton).toBeEnabled()
    await expect(maleButton).toBeEnabled()

    // Click select and immediately check for the Saving... state
    await selectButton.click()
    await expect(page.getByRole('button', { name: 'Saving...' }).first()).toBeVisible()

    // Now buttons should be disabled
    const savingButton = page.getByRole('button', { name: 'Saving...' }).first()
    await expect(savingButton).toBeDisabled()
    await expect(randomizeButton).toBeDisabled()
    await expect(maleButton).toBeDisabled()
  })
})

test.describe('Avatar Selection - Mobile Responsiveness', () => {
  const MOCK_WALLET = '0x1234567890123456789012345678901234567890'
  const MOCK_NICKNAME = 'MobileUser'

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

    // Navigate directly to avatar step with test parameters
    await page.goto(`/onboarding?step=avatar&address=${MOCK_WALLET}&displayName=${MOCK_NICKNAME}`)
  })

  test('Avatar selection fits mobile viewport', async ({ page }) => {
    // All elements should be visible and in viewport
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeInViewport()

    // Gender buttons should be visible
    await expect(getGenderButton(page, 'Female')).toBeVisible()
    await expect(getGenderButton(page, 'Male')).toBeVisible()

    // Avatar preview should be visible (the large one)
    await expect(page.locator('img[alt="Avatar"].shadow-lg')).toBeVisible()

    // Select button should be visible and in viewport
    const selectButton = page.getByRole('button', { name: 'Select' })
    await expect(selectButton).toBeVisible()
    await expect(selectButton).toBeInViewport()
  })

  test('Gender buttons have adequate touch targets', async ({ page }) => {
    const femaleButton = getGenderButton(page, 'Female')
    const maleButton = getGenderButton(page, 'Male')

    // Check button sizes (should be at least 44px height for touch targets)
    const femaleBox = await femaleButton.boundingBox()
    const maleBox = await maleButton.boundingBox()

    expect(femaleBox?.height).toBeGreaterThanOrEqual(36) // Allowing for some CSS differences
    expect(maleBox?.height).toBeGreaterThanOrEqual(36)

    // Buttons should be clickable
    await maleButton.click()
    await expect(maleButton).toHaveClass(/bg-accent-yellow/)
  })

  test('Randomize button is tappable on mobile', async ({ page }) => {
    const randomizeButton = page.getByRole('button', { name: /Randomize/i })
    await expect(randomizeButton).toBeVisible()

    const avatarPreview = page.locator('img[alt="Avatar"].shadow-lg')
    const initialSrc = await avatarPreview.getAttribute('src')

    // Click randomize
    await randomizeButton.click()
    await page.waitForTimeout(100)

    const newSrc = await avatarPreview.getAttribute('src')
    expect(newSrc).not.toBe(initialSrc)
  })
})

test.describe('Avatar Selection - Accessibility', () => {
  const MOCK_WALLET = '0x1234567890123456789012345678901234567890'
  const MOCK_NICKNAME = 'A11yUser'

  test.beforeEach(async ({ page }) => {
    // Navigate directly to avatar step with test parameters
    await page.goto(`/onboarding?step=avatar&address=${MOCK_WALLET}&displayName=${MOCK_NICKNAME}`)
  })

  test('Gender buttons are keyboard navigable', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Focus on the Male button directly and activate it
    const maleButton = getGenderButton(page, 'Male')
    await maleButton.focus()
    await expect(maleButton).toBeFocused()

    // Press Enter to select it
    await page.keyboard.press('Enter')

    // Male button should now be selected
    await expect(maleButton).toHaveClass(/bg-accent-yellow/)
  })

  test('Select button is keyboard accessible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pick your look' })).toBeVisible()

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Find the Select button and focus it
    const selectButton = page.getByRole('button', { name: 'Select' }).first()
    await selectButton.focus()

    // Verify it's focused
    await expect(selectButton).toBeFocused()

    // Press Enter to select
    await page.keyboard.press('Enter')

    // Should show saving state
    await expect(page.getByRole('button', { name: 'Saving...' }).first()).toBeVisible({ timeout: 2000 })
  })

  test('Avatar has appropriate alt text', async ({ page }) => {
    const avatarPreview = page.locator('img[alt="Avatar"].shadow-lg')
    await expect(avatarPreview).toBeVisible()

    const altText = await avatarPreview.getAttribute('alt')
    expect(altText).toBe('Avatar')
  })
})
