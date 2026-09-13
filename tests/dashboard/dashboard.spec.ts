import { expect, test } from '../../fixtures/base';
import { DashboardPage } from '../../pages/DashboardPage';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('renders KPI cards, route/job sections, map and attention area', async ({
    appShell,
    page,
    preset,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await appShell.expectPageHeading('Dashboard');
    await expectNoAppError(page);

    const kpiLabels = [
      'Jobs Today',
      'Scheduled Workload',
      'Vehicles Active',
      'Outstanding Bookings',
      `${preset.terms.document.plural} Awaiting`,
      'Invoice Issues',
    ];
    for (const label of kpiLabels) {
      await expect(dashboard.kpiCard(label), `KPI "${label}"`).toBeVisible();
    }

    for (const title of [
      "Today's Routes",
      'Recent Jobs',
      'Upcoming Service Events',
      "Today's Job Map",
      'Attention Required',
    ]) {
      await expect(
        dashboard.sectionWithHeading(title),
        `section "${title}"`,
      ).toBeVisible();
    }

    const todaysRoutes = dashboard.sectionWithHeading("Today's Routes");
    await expect(todaysRoutes.getByText('Stops').first()).toBeVisible();

    const recentJobs = dashboard.sectionWithHeading('Recent Jobs');
    await expect(recentJobs.getByRole('table')).toBeVisible();
    await expect(recentJobs.locator('tbody tr').first()).toBeVisible();

    // MapLibre renders a canvas — structural check only, no tile internals.
    const map = dashboard.sectionWithHeading("Today's Job Map");
    await expect(map.locator('canvas').first()).toBeVisible();
  });
});
