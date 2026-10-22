import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the Vite dev server.
 * Uses the locally installed Microsoft Edge (channel "msedge") so no browser
 * download is required. Switch `channel` to "chrome" or remove it to use
 * Playwright's bundled Chromium (`npx playwright install chromium`).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 3,
  timeout: 45_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5181',
    channel: 'msedge',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Edge'], channel: 'msedge' }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'msedge' }, grep: /@mobile/ },
  ],
  webServer: {
    command: 'npx vite --port 5181 --strictPort',
    url: 'http://localhost:5181',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
