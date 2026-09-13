import { expect, test } from '../../fixtures/base';
import {
  CustomerDetailPage,
  CustomersPage,
} from '../../pages/CustomersPage';
import { isSupabase } from '../../config/env';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('customer communications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('communications section renders on the customer record', async ({
    page,
  }) => {
    const customers = new CustomersPage(page);
    await customers.goto();
    await customers.openFirstCustomer();

    const detail = new CustomerDetailPage(page);
    await detail.waitForReady();
    await detail.selectTab('Communications');
    await expectNoAppError(page);

    const card = detail.communicationsCard;
    await expect(card).toBeVisible();
    // Either comm rows or the empty state — both are valid renders.
    await expect(
      card
        .getByRole('table')
        .or(card.getByText('No customer communications yet.')),
    ).toBeVisible();
  });

  test('a failed communication exposes Retry to authorised roles', async ({
    page,
  }) => {
    test.skip(
      !isSupabase,
      'mock communications are not linked to mock customers — no rows render',
    );

    const customers = new CustomersPage(page);
    await customers.goto();
    await customers.openFirstCustomer();

    const detail = new CustomerDetailPage(page);
    await detail.waitForReady();
    await detail.selectTab('Communications');

    const card = detail.communicationsCard;
    const failedRow = card
      .getByRole('row')
      .filter({ hasText: 'Failed' })
      .first();
    if ((await failedRow.count()) === 0) {
      test.skip(
        true,
        'no failed communication on this customer — seed one to cover retry',
      );
    }

    await failedRow.click();
    // Detail modal — Retry Send is offered to owner/admin/manager/office.
    await expect(
      page.getByRole('button', { name: 'Retry Send' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
  });
});
