import { test, expect } from '@playwright/test';

const BASE_URL = 'https://villa-production-vcryk.ondigitalocean.app';

test.describe('Passkey Integration on Live Site', () => {
  test('welcome page loads without errors', async ({ page }) => {
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check welcome screen renders
    await expect(page.getByRole('heading', { name: 'Villa' })).toBeVisible();

    // Check both auth buttons are present
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    const createBtn = page.getByRole('button', { name: /create villa id/i });

    await expect(signInBtn).toBeVisible();
    await expect(createBtn).toBeVisible();

    // Report any console errors (filter out expected ones)
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('Failed to load resource')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('Create Villa ID button triggers Porto flow', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /create villa id/i });
    await expect(createBtn).toBeVisible();

    // Click create button
    await createBtn.click();

    // Should show connecting state or Porto iframe
    await expect(
      page.getByText(/connecting/i).or(page.locator('iframe[src*="porto"]')).or(page.getByText(/creating/i))
    ).toBeVisible({ timeout: 5000 });
  });

  test('Sign In button triggers Porto flow', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await expect(signInBtn).toBeVisible();

    // Click sign in button
    await signInBtn.click();

    // Should show connecting state or Porto iframe
    await expect(
      page.getByText(/connecting/i).or(page.locator('iframe[src*="porto"]')).or(page.getByText(/signing/i))
    ).toBeVisible({ timeout: 5000 });
  });

  test('CSP headers allow Porto iframe', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response?.headers() || {};

    const csp = headers['content-security-policy'] || '';

    // Check frame-src allows Porto
    expect(csp).toContain('frame-src');
    expect(csp).toContain('porto.sh');

    // Check connect-src allows Porto RPC
    expect(csp).toContain('connect-src');
    expect(csp).toContain('rpc.porto.sh');
  });

  test('security headers are present', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response?.headers() || {};

    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
