import { isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { ReportsPage } from '../../pages/ReportsPage';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test(
    'reports page renders KPIs, charts and tabs',
    { tag: '@smoke' },
    async ({ appShell, page, preset }) => {
      const reports = new ReportsPage(page);
      await reports.goto();

      await appShell.expectPageHeading('Reports');
      await expectNoAppError(page);

      // Period selector — options differ slightly between mock and live data.
      const periods = isSupabase
        ? ['Today', 'This Week', 'This Month', 'Last Month', 'Last 30 Days']
        : ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];
      for (const period of periods) {
        await expect(reports.periodTab(period), `period "${period}"`).toBeVisible();
      }

      // Live reports: Financial tab only when Xero enabled, Waste tab only
      // when waste compliance enabled.
      if (isSupabase) {
        const tabs = [
          'Overview',
          'Operations',
          'Customers',
          'Fleet & Field Users',
          'Routes',
        ];
        if (preset.features['Xero (integration)']) tabs.push('Financial');
        if (preset.wasteModule) tabs.push('Waste');
        for (const tab of tabs) {
          await expect(reports.reportTab(tab), `tab "${tab}"`).toBeVisible();
        }
      } else {
        for (const tab of [
          'Overview',
          'Operations',
          'Commercial',
          'Fleet & Field Users',
          'Customers',
          'Items',
          'Service Locations',
          'Routes',
        ]) {
          await expect(reports.reportTab(tab), `tab "${tab}"`).toBeVisible();
        }

        // Overview tab content: KPI row + chart cards (no SVG internals).
        await expect(
          reports.chartCard('Revenue & Gross Profit'),
          'revenue chart card',
        ).toBeVisible();
        await expect(reports.chartCard('Job Type'), 'job type chart').toBeVisible();
        await expect(
          reports.chartCard('Items Collected'),
          'items chart',
        ).toBeVisible();
      }

      // CSV export control is present in both implementations.
      await expect(
        reports.main.getByRole('button', { name: 'Export CSV' }),
      ).toBeVisible();
    },
  );

  test('switching report tabs and periods updates content', async ({
    page,
  }) => {
    const reports = new ReportsPage(page);
    await reports.goto();

    await reports.reportTab('Fleet & Field Users').click();
    await expectNoAppError(page);

    if (isSupabase) {
      await reports.periodTab('Last 30 Days').click();
      await expectNoAppError(page);
    } else {
      await expect(
        page.getByRole('heading', { name: 'Vehicle Performance' }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Field User Performance' }),
      ).toBeVisible();

      await reports.periodTab('This Week').click();
      await expectNoAppError(page);
    }
  });
});
