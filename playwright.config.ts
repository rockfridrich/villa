import { defineConfig, devices } from '@playwright/test'

// Support testing against deployed URLs via BASE_URL env var
const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const isExternalUrl = baseURL !== 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.(spec|e2e)\.ts$/,
  testIgnore: ['**/unit/**', '**/*.test.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Longer timeouts for deployed environments (network latency)
    actionTimeout: isExternalUrl ? 30000 : 10000,
    navigationTimeout: isExternalUrl ? 60000 : 30000,
  },
  // Longer test timeout for deployed environments
  timeout: isExternalUrl ? 60000 : 30000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  // Only start local dev server if not testing external URL
  ...(isExternalUrl
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
        },
      }),
})
