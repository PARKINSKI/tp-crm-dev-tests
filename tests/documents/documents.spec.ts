import { isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import {
  DocumentDetailPage,
  DocumentsPage,
  WasteTransferNotesPage,
} from '../../pages/DocumentsPage';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('documents', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test(
    'list renders document records',
    { tag: '@smoke' },
    async ({ appShell, page, preset }) => {
      const documents = new DocumentsPage(page);
      await documents.goto();

      await appShell.expectPageHeading(preset.terms.document.plural);
      await expectNoAppError(page);
      await documents.expectRows();
    },
  );

  test('a document opens showing its detail sections', async ({ page }) => {
    const documents = new DocumentsPage(page);
    await documents.goto();
    await documents.openFirstDocument();

    const detail = new DocumentDetailPage(page);
    await detail.waitForReady();
    await expectNoAppError(page);
    await expect(
      detail.main.getByRole('heading', { level: 1 }),
    ).toContainText(/\S/);

    for (const section of [
      'Details',
      'Document Preview',
      'Version History',
      'Activity',
    ]) {
      await expect(
        detail.main.getByText(section, { exact: true }),
        `section "${section}"`,
      ).toBeVisible();
    }
  });

  test('waste transfer notes list and detail render (wasteDemo only)', async ({
    page,
    preset,
  }) => {
    test.skip(!preset.wasteModule, 'waste module disabled for this preset');

    const wtns = new WasteTransferNotesPage(page);
    await wtns.goto();
    await expectNoAppError(page);
    await wtns.expectRows();

    if (
      isSupabase &&
      (await page
        .getByText(/No Waste Transfer Notes yet/i)
        .isVisible()
        .catch(() => false))
    ) {
      test.skip(
        true,
        'no waste_transfer_note documents seeded for this organisation',
      );
    }

    await wtns.openFirstNote();

    if (isSupabase) {
      // In supabase mode WTN detail redirects into the generic document view.
      await expect(page).toHaveURL(/\/documents\/.+/);
      return;
    }

    await expect(
      page
        .getByRole('main')
        .getByRole('heading', { name: 'Waste Transfer Note', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText(/Section A . Transferor \/ Producer/),
    ).toBeVisible();
  });
});
