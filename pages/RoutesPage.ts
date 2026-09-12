import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ListPage } from './ListPage';
import { exactText } from '../utils/locators';

export class RoutesPage extends ListPage {
  protected readonly path = '/routes';

  constructor(page: Page) {
    super(page);
  }

  /** KPI card located by its label, e.g. "Planned Today". */
  kpiCard(label: string): Locator {
    return this.main
      .locator('div')
      .filter({ hasText: exactText(label) })
      .locator('..');
  }

  async openFirstRoute(): Promise<void> {
    await this.openFirstRow();
    await this.page.waitForURL(/\/routes\/.+/);
  }
}

export class RouteDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.main.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /**
   * Stops card including its list of stop items. 'Stops' also appears as an
   * info label in the summary/route-progress cards, so locate the card by the
   * combination of the title and stop ETA entries it contains.
   */
  get stopsCard(): Locator {
    return this.main
      .locator('div')
      .filter({ hasText: /Stops/ })
      .filter({ hasText: /(ETA|Start|Finish) \d{2}:\d{2}/ })
      .last();
  }

  /** The route map card containing the SVG map. */
  get mapCard(): Locator {
    return this.cardWithTitle('Route Map');
  }
}
