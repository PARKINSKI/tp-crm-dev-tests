import { env } from '../../config/env';
import { expect, test } from '../../fixtures/base';

test.describe('preset settings', () => {
  test('Active Preset indicator matches CLIENT_PRESET', async ({
    settings,
    preset,
  }) => {
    await settings.goto();

    await expect(settings.activePresetBadge).toHaveText(
      `Active Preset: ${preset.id}`,
    );
    expect(preset.id).toBe(env.clientPreset);
  });

  test('Settings > Organisation reports the preset organisation', async ({
    settings,
    preset,
  }) => {
    await settings.goto();

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
