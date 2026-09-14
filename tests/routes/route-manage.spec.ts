import { expect, test } from '../../fixtures/base';
import { RouteDetailPage, RoutesPage } from '../../pages/RoutesPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { uniqueRef } from '../../utils/testData';

/**
 * Route write-path coverage — supabase mode only. Creates an E2E-named route
 * and exercises stop add/reorder/remove without touching seeded routes.
 */
test.describe('route management', () => {
  test.beforeEach(async ({ page }) => {
    requireSupabase();
    await loginAs(page, 'owner');
  });

  test('create a route and manage its stops', async ({ page }) => {
    const name = uniqueRef('RTE');
    const routes = new RoutesPage(page);
    await routes.goto();
    await routes.createRouteButton.click();

    // Create Route modal — minimum required fields.
    const form = page.locator('form');
    await form.getByLabel('Name *').fill(name);
    await form
      .getByLabel('Date *')
      .fill(new Date().toISOString().slice(0, 10));
    await form.getByRole('button', { name: 'Create Route' }).click();

    // Lands on the new route's detail page.
    await page.waitForURL(/\/routes\/.+/);
    const detail = new RouteDetailPage(page);
    await detail.waitForReady();
    await expect(detail.heading).toContainText(name);
    await expect(detail.main.getByText('No stops on this route yet.'))
      .toBeVisible();

    // Add a job stop.
    await detail.addJobToRouteButton.click();
    const select = detail.jobToAddSelect;
    const optionCount = await select.locator('option').count();
    test.skip(
      optionCount < 2,
      'no unassigned jobs available to add — seed a planned job first',
    );
    await select.selectOption({ index: 1 });
    await detail.main.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(detail.main.getByText('No stops on this route yet.'))
      .toBeHidden();

    // Reorder/remove controls are available on editable routes.
    await expect(detail.removeStopButtons.first()).toBeVisible();

    // Cleanup: remove the added stop again (accepts the confirm dialog).
    page.once('dialog', (d) => void d.accept());
    await detail.removeStopButtons.first().click();
    await expect(detail.main.getByText('No stops on this route yet.'))
      .toBeVisible();
  });
});
