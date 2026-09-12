import { expect, test } from '../../fixtures/base';
import { SettingsPage } from '../../pages/SettingsPage';
import { expectNoAppError } from '../../utils/errors';

const SECTION_MARKERS: Record<string, string> = {
  Organisation: 'Organisation Name',
  Branding: 'Product Name',
  Terminology: 'Field User',
  Navigation: 'dashboard',
  'Users & Roles': 'Email',
  Features: 'Waste Compliance (module)',
  Statuses: 'Booking Statuses',
  Units: 'Distance Unit',
  Integrations: 'Accounting',
};

test.describe('settings', () => {
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
        await expect(
          settings.main.getByText(marker, { exact: true }).first(),
          `marker "${marker}"`,
        ).toBeVisible();
      });
    }
  });
});
