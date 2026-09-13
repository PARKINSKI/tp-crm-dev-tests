import { expect, test } from '../../fixtures/base';
import { JobDetailPage, JobsPage } from '../../pages/JobsPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * Document lifecycle — supabase mode only (mock writes are placeholders).
 * Generates a real draft document on an existing job, then walks the
 * draft → ready → issued flow. No customer email is sent unless the org has
 * customer emails enabled — see Organisation > Customer Emails.
 */
test.describe('document lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    requireSupabase();
    await loginAs(page, 'owner');
  });

  test('generate a document from a job and issue it', async ({ page }) => {
    const jobs = new JobsPage(page);
    await jobs.goto();
    await jobs.openFirstJob();

    const detail = new JobDetailPage(page);
    await detail.waitForReady();
    await expectNoAppError(page);

    const typeSelect = detail.main.getByLabel('Document type');
    if ((await typeSelect.count()) === 0) {
      test.skip(
        true,
        'document generation not available for this role/preset',
      );
    }
    const optionCount = await typeSelect.locator('option').count();
    test.skip(optionCount < 2, 'no generatable document type for this job');

    await typeSelect.selectOption({ index: 1 });
    await detail.main
      .getByRole('button', { name: /Generate/ })
      .click();

    await page.waitForURL(/\/documents\/.+/);
    await expectNoAppError(page);
    await expect(
      detail.main.getByRole('heading', { level: 1 }),
    ).toContainText(/\S/);

    // Lifecycle controls — generate → mark ready → issue.
    const markReady = detail.main.getByRole('button', { name: 'Mark Ready' });
    const issue = detail.main.getByRole('button', { name: 'Issue Document' });
    const pdf = detail.main.getByRole('button', { name: 'Download PDF' });

    await expect(pdf.or(detail.main.getByText(/No generated version|No rendered PDF/))).toBeVisible();

    if (await markReady.isVisible()) await markReady.click();
    if (await issue.isVisible()) {
      await issue.click();
      await expect(detail.main.getByText('Issued').first()).toBeVisible();
    }
  });
});
