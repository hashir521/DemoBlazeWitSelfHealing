// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Directory where test files are located
  testDir: './tests',

  // Run tests in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Global test timeout — 90 seconds for full E2E flows
  timeout: 90000,

  // Reporter to use
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // Base URL for your web app — change this to your target URL
    baseURL: 'https://www.demoblaze.com',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Slow down actions for visibility (set to 0 for full speed)
    actionTimeout: 10000,

    // Headed locally, headless in CI (CI has no display)
    headless: !!process.env.CI,

    // Start at a normal window size — the test will then animate to maximized
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      args: ['--window-size=1280,720'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
