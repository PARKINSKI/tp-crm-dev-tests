import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ListPage } from './ListPage';

export class DocumentsPage extends ListPage {
  protected readonly path = '/documents';

  constructor(page: Page) {
    super(page);
  }

  async openFirstDocument(): Promise<void> {
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

  async openFirstNote(): Promise<void> {
    await this.openFirstRow();
    await this.page.waitForURL(/\/modules\/waste\/waste-transfer-notes\/.+/);
  }
}
