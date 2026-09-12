import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ListPage } from './ListPage';

export class JobsPage extends ListPage {
  protected readonly path = '/jobs';

  constructor(page: Page) {
    super(page);
  }

  /** Status filter chip, e.g. 'All'. Chips include counts so match loosely. */
  statusChip(name: string | RegExp): Locator {
    return this.main.getByRole('button', { name });
  }

  async openFirstJob(): Promise<void> {
    await this.openFirstRow();
    await this.page.waitForURL(/\/jobs\/.+/);
  }
}

export class JobDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.main.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Labelled info field on the summary card, e.g. 'Customer', 'Site'. */
  infoLabel(label: string): Locator {
    return this.main.getByText(label, { exact: true });
  }
}
