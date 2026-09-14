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
    if (isSupabase) {
      // Live mode leads with the authenticated organisation — the seeded
      // E2E org name is environment-specific, so assert a real org is
      // shown rather than the product name or preset fiction.
      const org = (await appShell.organisationName.textContent())?.trim();
      const product = (await appShell.productName.textContent())?.trim();
      expect(org, 'organisation name is populated').toBeTruthy();
      expect(org).not.toBe(product);
    } else {
      await expect(appShell.organisationName).toHaveText(
        preset.organisationName,
      );
    }
    await expect(appShell.logo).toBeVisible();
  });

  test('document title is the product name', async ({
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
      // The field shows the org's configured brand colour — an override
      // when set, otherwise the preset fallback — so assert a valid hex.
      const input = page.getByLabel('Primary Colour', { exact: true });
      await expect(input).toHaveValue(/^#[0-9a-f]{6}$/i);
      return;
    }

    await settings.expectRowValue('Organisation', preset.organisationName);
    await settings.expectRowValue('Primary Colour', preset.primaryColour);
  });
});
