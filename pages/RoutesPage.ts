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

  /** Supabase mode only — opens the create-route modal. */
  get createRouteButton(): Locator {
    return this.main.getByRole('button', { name: '+ Create Route', exact: true });
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

  /**
   * The route map card (MapLibre canvas + legend). The container carries only
   * CSS-module classes, so the canvas element is the stable structural hook.
   */
  get mapCard(): Locator {
    return this.cardWithTitle('Route Map');
  }

  get mapCanvas(): Locator {
    return this.mapCard.locator('canvas').first();
  }

  /** Supabase + route-planning roles only. */
  get recalculateButton(): Locator {
    return this.main.getByRole('button', { name: 'Recalculate Route' });
  }

  /** Editable routes only (supabase, draft/planned/ready). */
  get addJobToRouteButton(): Locator {
    return this.main.getByRole('button', { name: 'Add Job to Route' });
  }

  get jobToAddSelect(): Locator {
    return this.main.getByLabel('Job to add');
  }

  get removeStopButtons(): Locator {
    return this.main.getByRole('button', { name: 'Remove stop' });
  }

  get moveStopUpButtons(): Locator {
    return this.main.getByRole('button', { name: 'Move Stop Up' });
  }

  get moveStopDownButtons(): Locator {
    return this.main.getByRole('button', { name: 'Move Stop Down' });
  }
}
