import { NAV_HREFS, type NavKey } from '../../config/presets';
import { expect, test } from '../../fixtures/base';
import { loginAs } from '../../utils/auth';

const ALL_HREFS = new Set(Object.values(NAV_HREFS));

test.describe('preset navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('sidebar shows the expected items in the expected order', async ({
    appShell,
    preset,
  }) => {
    await appShell.goto('/');

    // Assert link text order — labels are terminology-driven per preset.
    await expect(appShell.navLinks).toHaveText(
      preset.navItems.map((item) => item.label),
    );

    // Assert each expected route is present exactly once.
    for (const item of preset.navItems) {
      await expect(
        appShell.navLinkByHref(item.href),
        `nav link ${item.key} (${item.href})`,
      ).toHaveCount(1);
    }
  });

  test('nav items excluded by the preset are not rendered', async ({
    appShell,
    preset,
  }) => {
    await appShell.goto('/');

    const expectedHrefs = new Set(preset.navItems.map((item) => item.href));
    for (const href of ALL_HREFS) {
      if (!expectedHrefs.has(href)) {
        await expect(
          appShell.navLinkByHref(href),
          `nav link ${href} should be absent`,
        ).toHaveCount(0);
      }
    }
  });

  test('navigating to each module shows its page heading', async ({
    appShell,
    preset,
  }) => {
    await appShell.goto('/');

    for (const item of preset.navItems) {
      await appShell.navLinkByHref(item.href).click();
      await appShell.expectPageHeading(item.label);
    }
  });
});
