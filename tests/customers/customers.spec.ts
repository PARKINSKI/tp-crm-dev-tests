import { expect, test } from '../../fixtures/base';
import {
  CustomerDetailPage,
  CustomersPage,
} from '../../pages/CustomersPage';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('customers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test(
    'list renders with at least one customer',
    { tag: '@smoke' },
    async ({ appShell, page }) => {
      const customers = new CustomersPage(page);
      await customers.goto();

      await appShell.expectPageHeading('Customers');
      await expectNoAppError(page);
      await customers.expectRows();
    },
  );

  test('first customer opens with detail tabs and sections', async ({
    page,
  }) => {
    const customers = new CustomersPage(page);
    await customers.goto();
    await customers.openFirstCustomer();

    const detail = new CustomerDetailPage(page);
    await detail.waitForReady();
    await expectNoAppError(page);
    await expect(
      detail.main.getByRole('heading', { level: 1 }),
    ).toContainText(/\S/);

    for (const tab of [
      'Overview',
      'Bookings',
      'Jobs',
      'Documents',
      'Communications',
      'Notes & Activity',
    ]) {
      await expect(detail.tab(tab), `tab "${tab}"`).toBeVisible();
    }

    for (const card of [
      'Site Access & Job Notes',
      'Job Profile',
      'Recent Jobs',
    ]) {
      await expect(detail.cardWithTitle(card), `card "${card}"`).toBeVisible();
    }

    await detail.selectTab('Bookings');
    await expect(detail.main.getByRole('table')).toBeVisible();

    await detail.selectTab('Documents');
    await expect(detail.main.getByRole('table')).toBeVisible();
  });
});
