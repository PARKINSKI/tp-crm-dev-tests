import { expect, test } from '../../fixtures/base';
import { ReportsPage } from '../../pages/ReportsPage';
import { expectNoAppError } from '../../utils/errors';

test.describe('reports', () => {
  test('reports page renders KPIs, charts and tabs', async ({
    appShell,
    page,
    preset,
  }) => {
    const reports = new ReportsPage(page);
    await reports.goto();

    await appShell.expectPageHeading('Reports');
    await expectNoAppError(page);

    for (const period of [
      'Today',
      'This Week',
      'This Month',
      'This Quarter',
      'This Year',
    ]) {
      await expect(reports.periodTab(period), `period "${period}"`).toBeVisible();
    }

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
  });

  test('switching report tabs and periods updates content', async ({
    page,
  }) => {
    const reports = new ReportsPage(page);
    await reports.goto();

    await reports.reportTab('Fleet & Field Users').click();
    await expect(
      page.getByRole('heading', { name: 'Vehicle Performance' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Field User Performance' }),
    ).toBeVisible();

    const before = await reports.periodRange.first().textContent();
    await reports.periodTab('This Week').click();
    await expect(reports.periodRange.first()).not.toHaveText(before ?? '');
  });
});
