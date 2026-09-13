import { expect, test } from '../../fixtures/base';
import { RouteDetailPage, RoutesPage } from '../../pages/RoutesPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * @live @routing-live — the ONLY test that calls OpenRouteService via the
 * route-directions edge function. Excluded from the default regression run
 * (npm run test:regression) to conserve external API quota.
 * Run explicitly with: npm run test:live
 */
test.describe(
  'live road routing',
  { tag: ['@live', '@routing-live'] },
  () => {
    test.beforeEach(async ({ page }) => {
      requireSupabase();
      await loginAs(page, 'owner');
    });

    test('recalculate route produces road distance and driving time', async ({
      page,
    }) => {
      const routes = new RoutesPage(page);
      await routes.goto();
      await routes.openFirstRoute();

      const detail = new RouteDetailPage(page);
      await detail.waitForReady();
      await expectNoAppError(page);

      const recalc = detail.recalculateButton;
      if (!(await recalc.isVisible())) {
        test.skip(
          true,
          'route is not recalculable for this role — needs owner/admin/manager/office',
        );
      }

      await recalc.click();

      // Edge function + ORS call — allow generous but bounded time.
      const distance = detail.main
        .getByText('Driving Distance', { exact: true })
        .locator('..')
        .locator('> *')
        .nth(1);
      const duration = detail.main
        .getByText('Est. Driving Time', { exact: true })
        .locator('..')
        .locator('> *')
        .nth(1);

      await expect(distance).not.toHaveText('—', { timeout: 45_000 });
      await expect(duration).not.toHaveText('—');

      // A second unchanged recalculation resolves without an ORS round-trip
      // (server-side fingerprint cache). Only assert it still succeeds —
      // the cached flag is not surfaced in the UI.
      await recalc.click();
      await expect(distance).not.toHaveText('—', { timeout: 45_000 });
      await expectNoAppError(page);
    });
  },
);
