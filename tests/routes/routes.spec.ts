import { expect, test } from '../../fixtures/base';
import { RouteDetailPage, RoutesPage } from '../../pages/RoutesPage';
import { expectNoAppError } from '../../utils/errors';

test.describe('routes', () => {
  test('list renders KPIs and route rows', async ({
    appShell,
    page,
    preset,
  }) => {
    const routes = new RoutesPage(page);
    await routes.goto();

    await appShell.expectPageHeading(preset.terms.route.plural);
    await expectNoAppError(page);

    for (const label of [
      'Planned Today',
      'In Progress',
      'Completed This Week',
      'Average Stops / Route',
      'Average Load Utilisation',
    ]) {
      await expect(routes.kpiCard(label), `KPI "${label}"`).toBeVisible();
    }

    await routes.expectRows();
  });

  test('a route opens showing stops and the route map', async ({ page }) => {
    const routes = new RoutesPage(page);
    await routes.goto();
    await routes.openFirstRoute();

    const detail = new RouteDetailPage(page);
    await detail.waitForReady();
    await expectNoAppError(page);
    await expect(
      detail.main.getByRole('heading', { level: 1 }),
    ).toContainText(/\S/);

    const stops = detail.stopsCard;
    await expect(stops).toBeVisible();
    await expect(
      stops,
      'stops card contains at least one stop with timing',
    ).toContainText(/(ETA|Start|Finish) \d{2}:\d{2}/);

    await expect(detail.mapCard).toBeVisible();
    await expect(detail.mapCard.locator('svg').first()).toBeVisible();
  });
});
