import { expect, test as base } from '@playwright/test';
import { AppShellPage } from '../pages/AppShellPage';
import { SettingsPage } from '../pages/SettingsPage';
import { preset, type PresetExpectations } from '../config/presets';

type AppFixtures = {
  /** Shared CRM shell page object, ready to use without manual setup. */
  appShell: AppShellPage;
  /** Settings screen page object. */
  settings: SettingsPage;
  /** Expectations for the preset under test (from CLIENT_PRESET). */
  preset: PresetExpectations;
};

export const test = base.extend<AppFixtures>({
  appShell: async ({ page }, use) => {
    await use(new AppShellPage(page));
  },
  settings: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  // eslint-disable-next-line no-empty-pattern
  preset: async ({}, use) => {
    await use(preset);
  },
});

export { expect };
