import { NAV_HREFS, type NavKey, type TermKey } from '../../config/presets';
import { test } from '../../fixtures/base';
import { loginAs } from '../../utils/auth';

const HEADING_ROUTES: Partial<Record<TermKey, NavKey>> = {
  job: 'jobs',
  booking: 'bookings',
  fieldUser: 'fieldUsers',
  document: 'documents',
  route: 'routes',
};

test.describe('preset terminology', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('module pages use the preset wording in their headings', async ({
    appShell,
    preset,
  }) => {
    await appShell.goto('/');

    for (const [term, navKey] of Object.entries(HEADING_ROUTES) as [
      TermKey,
      NavKey,
    ][]) {
      const href = NAV_HREFS[navKey];
      if (!preset.navItems.some((item) => item.href === href)) continue;
      await appShell.goto(href);
      await appShell.expectPageHeading(preset.terms[term].plural);
    }
  });
});
