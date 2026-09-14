// eslint-disable-next-line import/order -- must run before ./config/env reads process.env
import './config/envLoader';
import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

export default defineConfig({
  testDir: './tests',
  globalSetup: './config/globalSetup',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: env.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      // Core admin/back-office coverage — desktop viewport.
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /tests[\\/]driver[\\/]/,
    },
    {
      // Driver workflow is mobile-first — run those specs on a phone viewport.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /tests[\\/]driver[\\/]/,
    },
    // Additional browsers can be enabled when needed:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   testIgnore: /tests[\\/]driver[\\/]/,
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   testIgnore: /tests[\\/]driver[\\/]/,
    // },
  ],
});
