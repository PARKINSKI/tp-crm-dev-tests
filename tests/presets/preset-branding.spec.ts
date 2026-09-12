import { expect, test } from '../../fixtures/base';

test.describe('preset branding', () => {
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
  }) => {
    await settings.goto();
    await settings.selectSection('Branding');

    await settings.expectRowValue('Product Name', preset.productName);
    await settings.expectRowValue('Primary Colour', preset.primaryColour);
  });
});
