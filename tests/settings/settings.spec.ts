import { expect, test } from '../../fixtures/base';
import { SettingsPage } from '../../pages/SettingsPage';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

const SECTION_MARKERS: Record<string, string | RegExp> = {
  Organisation: 'Organisation Name',
  'Users & Roles': 'Email',
  Pricing: /Pricing|pricing/,
  Branding: /Primary [Cc]olour/,
  Terminology: 'Field User',
  Navigation: 'dashboard',
  Features: 'Waste Compliance (module)',
  Statuses: 'Booking Statuses',
  Units: 'Distance Unit',
  Integrations: 'Accounting',
  Backend: 'Data Mode',
};

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('all configuration sections are present and render content', async ({
    appShell,
    page,
  }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await appShell.expectPageHeading('Settings');
    await expectNoAppError(page);

    for (const [section, marker] of Object.entries(SECTION_MARKERS)) {
      await test.step(`section: ${section}`, async () => {
        await expect(
          settings.sectionChip(section),
          `chip "${section}"`,
        ).toBeVisible();
        await settings.selectSection(section);
        const markerLocator =
          marker instanceof RegExp
            ? settings.main.getByText(marker).first()
            : settings.main.getByText(marker, { exact: true }).first();
        await expect(markerLocator, `marker "${marker}"`).toBeVisible();
      });
    }
  });
});
