import { isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { loginAs } from '../../utils/auth';

test.describe('preset settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  /**
   * The 'Active Preset' badge and other developer diagnostics were removed
   * from the app entirely — the customer-facing UI must never render the
   * internal preset id (demo, wasteDemo, ...).
   */
  test('no preset identifier or developer diagnostics are rendered', async ({
    settings,
    preset,
  }) => {
    await settings.goto();

    await expect(settings.main.getByText(/Active Preset/)).toHaveCount(0);
    await expect(
      settings.main.getByText(preset.id, { exact: true }),
    ).toHaveCount(0);
  });

  test('Settings > Organisation reports the organisation', async ({
    settings,
    preset,
    page,
  }) => {
    await settings.goto();

    if (isSupabase) {
      // Live mode: organisation admin form — the org name field is
      // populated from the database, not from the preset file.
      const input = page
        .getByText('Organisation Name', { exact: true })
        .locator('..')
        .locator('input')
        .first();
      await expect(input).not.toHaveValue('');
      return;
    }

    await settings.expectRowValue('Organisation Name', preset.organisationName);
  });

  test('Settings > Units reports the preset measurement units', async ({
    settings,
    preset,
  }) => {
    await settings.goto();
    await settings.selectSection('Units');

    await settings.expectRowValue('Quantity', preset.units.quantity);
    await settings.expectRowValue('Capacity', preset.units.capacity);
    await settings.expectRowValue('Volume', preset.units.volume);
    await settings.expectRowValue('Distance Unit', preset.units.distance);
  });

  test('Settings > Integrations reports friendly module availability', async ({
    settings,
    preset,
  }) => {
    await settings.goto();
    await settings.selectSection('Integrations');

    for (const [label, enabled] of Object.entries(preset.integrations)) {
      const expected =
        label === 'Xero Accounting'
          ? enabled
            ? 'Available'
            : 'Not included'
          : enabled
            ? 'Included'
            : 'Not included';
      await settings.expectRowValue(label, expected);
    }
  });
});
