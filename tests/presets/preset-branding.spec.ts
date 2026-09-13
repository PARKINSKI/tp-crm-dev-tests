import { isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { loginAs } from '../../utils/auth';

test.describe('preset branding', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('sidebar shows the expected product and organisation', async ({
    appShell,
    preset,
  }) => {
    await appShell.goto('/');

    await expect(appShell.productName).toHaveText(preset.productName);
    await expect(appShell.organisationName).toHaveText(preset.organisationName);
    await expect(appShell.logo).toBeVisible();
  });

  test('document title reflects the preset organisation', async ({
    appShell,
    page,
    preset,
  }) => {
    await appShell.goto('/');

    await expect(page).toHaveTitle(preset.documentTitle);
  });

  test('brand colour is applied to the --brand-primary CSS variable', async ({
    appShell,
    page,
    preset,
  }) => {
    await appShell.goto('/');

    const brandPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--brand-primary')
        .trim(),
    );
    expect(brandPrimary).toBe(preset.primaryColour);
  });

  test('Settings > Branding reports the preset identity', async ({
    settings,
    preset,
    page,
  }) => {
    await settings.goto();
    await settings.selectSection('Branding');

    if (isSupabase) {
      // Live mode renders the editable branding form instead of info rows.
      // (Labels aren't htmlFor-wired — locate the input next to its label.)
      const input = page
        .getByText('Primary Colour', { exact: true })
        .locator('..')
        .locator('input')
        .first();
      await expect(input).toHaveValue(preset.primaryColour);
      return;
    }

    await settings.expectRowValue('Organisation', preset.organisationName);
    await settings.expectRowValue('Primary Colour', preset.primaryColour);
  });
});
