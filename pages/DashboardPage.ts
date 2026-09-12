import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { exactText } from '../utils/locators';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto('/');
  }

  /**
   * KPI card located by its label, e.g. "Jobs Today". Matches only divs whose
   * whole text is the label — status spans/cells can share the same text.
   */
  kpiCard(label: string): Locator {
    return this.main
      .locator('div')
      .filter({ hasText: exactText(label) })
      .locator('..')
      .locator('..');
  }
}
