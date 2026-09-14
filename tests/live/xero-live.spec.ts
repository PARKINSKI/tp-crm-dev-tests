import { expect, test } from '../../fixtures/base';
import { SettingsPage } from '../../pages/SettingsPage';
import { JobDetailPage, JobsPage } from '../../pages/JobsPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * @live @xero-live — Xero integration surface. Verifies connection state and
 * authorised controls only; never initiates OAuth or creates real invoices
 * (invoice creation stays a manual/UAT action).
 * Run explicitly with: npm run test:live
 */
test.describe(
  'live xero integration',
  { tag: ['@live', '@xero-live'] },
  () => {
    test.beforeEach(async ({ page }) => {
      requireSupabase();
      await loginAs(page, 'owner');
    });

    test('xero settings renders the connection state', async ({
      page,
      preset,
    }) => {
      test.skip(
        !preset.integrations['Xero Accounting'],
        'xero disabled for this preset',
      );

      const settings = new SettingsPage(page);
      await settings.goto();
      await settings.selectSection('Integrations');
      await expectNoAppError(page);

      const card = page.getByText('Xero Accounting', { exact: true }).locator('..');
      await expect(card).toBeVisible();
      // One of the known states renders: connected info grid, "Not
      // connected" + Connect button, or a reconnect/error state.
      await expect(
        card
          .getByText(/Not connected|Connected|Reconnect required|Unable to check/)
          .or(card.getByRole('button', { name: /Xero/ })),
      ).toBeVisible();
    });

    test('job accounting section renders when xero is enabled', async ({
      page,
      preset,
    }) => {
      test.skip(
        !preset.integrations['Xero Accounting'],
        'xero disabled for this preset',
      );

      const jobs = new JobsPage(page);
      await jobs.goto();
      await jobs.openFirstJob();

      const detail = new JobDetailPage(page);
      await detail.waitForReady();
      await expectNoAppError(page);

      await expect(
        detail.main.getByText('Accounting — Xero', { exact: true }),
      ).toBeVisible();
    });
  },
);
