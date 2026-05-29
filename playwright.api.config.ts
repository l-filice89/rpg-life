import { defineConfig } from '@playwright/test';

const apiBaseURL = process.env.API_URL ?? 'http://localhost:3002';

export default defineConfig({
  testDir: './tests/api',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: apiBaseURL,
  },
});
