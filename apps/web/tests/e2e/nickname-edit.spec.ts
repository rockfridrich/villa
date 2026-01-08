import { test, expect } from '@playwright/test'

test.describe('Nickname Editing', () => {
  test('test placeholder', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
  })
})
