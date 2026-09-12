import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ListPage } from './ListPage';
import { exactText } from '../utils/locators';

export class BookingsPage extends ListPage {
  protected readonly path = '/bookings';

  constructor(page: Page) {
    super(page);
  }

  /** Summary card located by its label, e.g. "Awaiting Planning". */
  summaryCard(label: string): Locator {
    return this.main
      .locator('div')
      .filter({ hasText: exactText(label) })
      .locator('..');
  }

  async openFirstBooking(): Promise<void> {
    await this.openFirstRow();
    await this.page.waitForURL(/\/bookings\/.+/);
  }
}

export class BookingDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.main.getByRole('heading', { level: 1 })).toBeVisible();
  }
}
