import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3003";
const isExternalUrl = baseURL !== "http://localhost:3003";
const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.(spec|e2e)\.ts$/,

  fullyParallel: true,
  workers: CI ? 1 : undefined, // Single worker for telemetry (lightweight)

  forbidOnly: CI,
  retries: CI ? 1 : 0,

  reporter: CI
    ? [["github"], ["html"], ["json", { outputFile: "test-results.json" }]]
    : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: isExternalUrl ? 30000 : 10000,
    navigationTimeout: isExternalUrl ? 60000 : 30000,
  },

  timeout: isExternalUrl ? 60000 : 30000,
  outputDir: "test-results/",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  ...(isExternalUrl
    ? {}
    : {
        webServer: {
          command: CI ? "bun run start" : "bun run dev",
          url: "http://localhost:3003",
          reuseExistingServer: !CI,
          timeout: CI ? 30000 : 120000,
        },
      }),
});
