import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DispatchPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto('/dispatch');
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(
      this.main.getByRole('heading', { name: 'Dispatch & Route Planner' }),
    ).toBeVisible();
  }

  /** Side-panel title, e.g. 'Unplanned Jobs', 'Route Summary', 'Stops'. */
  panel(title: string): Locator {
    return this.main.getByText(title, { exact: true });
  }

  /** The route map placeholder (an inline SVG visualisation). */
  get map(): Locator {
    return this.main.locator('svg').first();
  }
}
