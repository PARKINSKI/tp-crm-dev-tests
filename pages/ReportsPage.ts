import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto('/reports');
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(
      this.main.getByRole('heading', { name: 'Reports' }),
    ).toBeVisible();
  }

  /** Period selector tab, e.g. 'Today', 'This Month', 'This Year'. */
  periodTab(label: string): Locator {
    return this.main.getByRole('button', { name: label, exact: true });
  }

  /** Report section tab, e.g. 'Overview', 'Fleet & Field Users'. */
  reportTab(label: string): Locator {
    return this.main.getByRole('button', { name: label, exact: true });
  }

  /** Chart card located by its title, e.g. 'Revenue & Gross Profit'. */
  chartCard(title: string): Locator {
    return this.main.getByText(title, { exact: true }).locator('..');
  }
}
