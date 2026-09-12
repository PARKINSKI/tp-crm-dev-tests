import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Shared behaviour for the module list pages (Customers, Bookings, Jobs,
 * Routes, Documents, …): a toolbar above a data table whose rows navigate to
 * a detail view on click.
 */
export abstract class ListPage extends BasePage {
  protected abstract readonly path: string;

  get table(): Locator {
    return this.main.getByRole('table');
  }

  /** Data rows only (excludes the header row). */
  get rows(): Locator {
    return this.table.locator('tbody tr');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.table).toBeVisible();
  }

  async expectRows(min = 1): Promise<void> {
    await expect(this.rows.first()).toBeVisible();
    expect(await this.rows.count()).toBeGreaterThanOrEqual(min);
  }

  async openFirstRow(): Promise<void> {
    await this.rows.first().click();
  }
}
