import { isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { SettingsPage } from '../../pages/SettingsPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * Customer-facing Settings sections. 'System Status' is additionally gated
 * to supabase mode and owner/admin roles, so it is appended separately.
 */
const SECTION_MARKERS: Record<string, string | RegExp> = {
  Organisation: 'Organisation Name',
  'Users & Roles': /Email/,
  Pricing: /Pricing|pricing/,
  Branding: /Primary [Cc]olour/,
  Units: 'Distance Unit',
  Integrations: 'Xero Accounting',
  About: /Powered by/,
};

/**
 * Build-time/preset configuration sections that were removed from the
 * customer-facing UI. They must never come back as Settings chips.
 */
const REMOVED_SECTIONS = [
  'Terminology',
  'Navigation',
  'Features',
  'Statuses',
  'Backend',
];

const EXPECTED_CHIPS = [...Object.keys(SECTION_MARKERS)];

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

    const markers = isSupabase
      ? { ...SECTION_MARKERS, 'System Status': 'Customer Emails' }
      : SECTION_MARKERS;

    for (const [section, marker] of Object.entries(markers)) {
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

  test('only customer-facing sections are offered', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    // Exact chip list — System Status only for supabase owner/admin.
    await expect(settings.sectionChips).toHaveText(
      isSupabase
        ? [...EXPECTED_CHIPS.slice(0, -1), 'System Status', 'About']
        : EXPECTED_CHIPS,
    );

    // Removed build-time configuration sections must not reappear.
    for (const removed of REMOVED_SECTIONS) {
      await expect(
        settings.sectionChip(removed),
        `removed section "${removed}"`,
      ).toHaveCount(0);
    }
  });

  test('Units is a read-only operational reference', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.selectSection('Units');

    await expect(
      settings.main.getByText(/Contact TP Interactive to change/),
    ).toBeVisible();
    // No form controls — the reference is not editable in-app.
    await expect(
      settings.main.locator('input, select, textarea'),
    ).toHaveCount(0);
  });

  test('System Status reports customer-safe integration health', async ({
    page,
  }) => {
    requireSupabase();
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.selectSection('System Status');

    for (const label of [
      'Platform',
      'Customer Emails',
      'Road Routing',
      'Xero Integration',
      'Scheduled Processing',
    ]) {
      await expect(
        settings.rowValue(label),
        `status row "${label}"`,
      ).toHaveText(/Operational|Configured|Not configured|Unavailable|Checking…|Requires attention/);
    }
  });
});
