import { expect, test } from '../../fixtures/base';
import { JobDetailPage, JobsPage } from '../../pages/JobsPage';
import { expectNoAppError } from '../../utils/errors';

test.describe('jobs', () => {
  test('list renders jobs with status filters', async ({
    appShell,
    page,
    preset,
  }) => {
    const jobs = new JobsPage(page);
    await jobs.goto();

    await appShell.expectPageHeading(preset.terms.job.plural);
    await expectNoAppError(page);
    await expect(jobs.statusChip('All')).toBeVisible();
    await jobs.expectRows();
  });

  test('a job opens showing customer, site and status details', async ({
    page,
    preset,
  }) => {
    const jobs = new JobsPage(page);
    await jobs.goto();
    await jobs.openFirstJob();

    const detail = new JobDetailPage(page);
    await detail.waitForReady();
    await expectNoAppError(page);
    await expect(
      detail.main.getByRole('heading', { level: 1 }),
    ).toContainText(/\S/);

    await expect(
      detail.cardWithTitle(`${preset.terms.job.singular} Summary`),
    ).toBeVisible();
    for (const label of [
      preset.terms.site.singular,
      preset.terms.fieldUser.singular,
      'Vehicle',
    ]) {
      await expect(detail.infoLabel(label), `info "${label}"`).toBeVisible();
    }
    await expect(detail.cardWithTitle('Photos & Evidence')).toBeVisible();
    await expect(
      detail.cardWithTitle(preset.terms.document.plural),
    ).toBeVisible();
  });
});
