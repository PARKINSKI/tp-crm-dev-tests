import { env, isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { loginAs } from '../../utils/auth';

test.describe('preset settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  /**
   * The 'Active Preset' badge is developer diagnostics only — the app gates
   * it behind import.meta.env.DEV, so it renders on `vite dev` but never in
   * production builds. If absent we assert nothing (correct prod behaviour);
   * when present it must still match CLIENT_PRESET.
   */
  test('Active Preset indicator matches CLIENT_PRESET when shown', async ({
    settings,
    preset,
  }) => {
    await settings.goto();

    // Wait for the page header to settle before probing for the badge.
    await expect(
      settings.main.getByRole('heading', { name: 'Settings' }),
    ).toBeVisible();
    if (!(await settings.activePresetBadge.isVisible())) {
      test.info().annotations.push({
        type: 'note',
        description:
          'Active Preset badge hidden — production build (expected)',
      });
      return;
    }
    await expect(settings.activePresetBadge).toHaveText(
      `Active Preset: ${preset.id}`,
    );
    expect(preset.id).toBe(env.clientPreset);
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
  });

  test('Settings > Features reports the preset feature flags', async ({
    settings,
    preset,
  }) => {
    await settings.goto();
    await settings.selectSection('Features');

    for (const [label, enabled] of Object.entries(preset.features)) {
      await settings.expectRowValue(label, enabled ? 'Enabled' : 'Disabled');
    }
  });
});
