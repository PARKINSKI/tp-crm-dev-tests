import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ListPage } from './ListPage';

export class DocumentsPage extends ListPage {
  protected readonly path = '/documents';

  constructor(page: Page) {
    super(page);
  }

  async openFirstDocument(): Promise<void> {
    // tbody renders a 'Loading…' placeholder row first — wait for a real
    // data row (identifiable by its View action) before clicking.
    await this.table.getByRole('button', { name: 'View' }).first().waitFor();
    await this.openFirstRow();
    await this.page.waitForURL(/\/documents\/.+/);
  }
}

export class DocumentDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.main.getByRole('heading', { level: 1 })).toBeVisible();
  }
}

/** Waste Transfer Notes list — only mounted when the preset enables waste. */
export class WasteTransferNotesPage extends ListPage {
  protected readonly path = '/modules/waste/waste-transfer-notes';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Opens the first note. Mock mode uses the dedicated WTN detail page;
   * supabase mode renders generic documents, whose rows navigate straight to
   * /documents/:id.
   */
  async openFirstNote(): Promise<void> {
    await this.table.getByRole('button', { name: 'View' }).first().waitFor();
    await this.openFirstRow();
    await this.page.waitForURL(/\/(modules\/waste\/waste-transfer-notes|documents)\/.+/);
  }
}
