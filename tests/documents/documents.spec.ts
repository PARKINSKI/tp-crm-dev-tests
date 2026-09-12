import { expect, test } from '../../fixtures/base';
import {
  DocumentDetailPage,
  DocumentsPage,
  WasteTransferNotesPage,
} from '../../pages/DocumentsPage';
import { expectNoAppError } from '../../utils/errors';

test.describe('documents', () => {
  test('list renders document records', async ({ appShell, page, preset }) => {
    const documents = new DocumentsPage(page);
    await documents.goto();

    await appShell.expectPageHeading(preset.terms.document.plural);
    await expectNoAppError(page);
    await documents.expectRows();
  });

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
      'Customer Details',
      'Quantities',
      'Commercial',
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

    await wtns.openFirstNote();
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
