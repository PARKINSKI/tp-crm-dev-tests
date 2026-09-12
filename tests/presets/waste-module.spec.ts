import { preset } from '../../config/presets';
import { expect, test } from '../../fixtures/base';

const WTN_ROUTE = '/modules/waste/waste-transfer-notes';

test.describe('waste module', () => {
  test('waste navigation is visible and the module loads', async ({
    appShell,
    page,
  }) => {
    test.skip(!preset.wasteModule, 'waste module disabled for this preset');

    await appShell.goto('/');

    const wtnLink = appShell.navLinkByHref(WTN_ROUTE);
    await expect(wtnLink).toBeVisible();
    await wtnLink.click();

    await expect(page).toHaveURL(WTN_ROUTE);
    await appShell.expectPageHeading('Waste Transfer Notes');
  });

  test('waste navigation is absent and the route is not mounted', async ({
    appShell,
    page,
  }) => {
    test.skip(preset.wasteModule, 'waste module enabled for this preset');

    await appShell.goto('/');
    await expect(appShell.navLinkByHref(WTN_ROUTE)).toHaveCount(0);

    // The module's routes are not mounted — direct access redirects home.
    await page.goto(WTN_ROUTE);
    await expect(page).toHaveURL('/');
    await appShell.expectPageHeading('Dashboard');
  });
});
