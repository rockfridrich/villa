import { defineConfig, devices } from '@playwright/test'

// Support testing against deployed URLs via BASE_URL env var
const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const isExternalUrl = baseURL !== 'http://localhost:3000'

// Parallel execution config
const CI = !!process.env.CI

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.(spec|e2e)\.ts$/,
  testIgnore: ['**/unit/**', '**/*.test.ts'],

  // Parallel execution
  fullyParallel: true,
  workers: CI ? '50%' : undefined, // Use 50% of CPUs in CI (typically 2 workers)

  // CI settings
  forbidOnly: CI,
  retries: CI ? 2 : 0,

  // Reporters
  reporter: CI
    ? [['github'], ['html'], ['json', { outputFile: 'test-results.json' }]]
    : 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Longer timeouts for deployed environments (network latency)
    actionTimeout: isExternalUrl ? 30000 : 10000,
    navigationTimeout: isExternalUrl ? 60000 : 30000,
  },

  // Longer test timeout for deployed environments
  timeout: isExternalUrl ? 60000 : 30000,

  // Output directory for test artifacts
  outputDir: 'test-results/',
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
          command: 'pnpm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
        },
      }),
})
