import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ListPage } from './ListPage';

export class CustomersPage extends ListPage {
  protected readonly path = '/customers';

  constructor(page: Page) {
    super(page);
  }

  async openFirstCustomer(): Promise<void> {
    await this.openFirstRow();
    await this.page.waitForURL(/\/customers\/.+/);
  }
}

export class CustomerDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.main.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Detail tab, e.g. 'Overview', 'Bookings', 'Jobs', 'Documents'. */
  tab(name: string): Locator {
    return this.main.getByRole('button', { name, exact: true });
  }

  async selectTab(name: string): Promise<void> {
    await this.tab(name).click();
  }
}
