import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The real driver workflow (/driver) — mobile-first shell used by field
 * users. Works in mock mode (in-memory demo routes) and supabase mode
 * (requires a field_user account).
 */
export class DriverHomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/driver');
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    // Either a route card (with a next stop) or the empty state.
    await expect(
      this.page
        .getByText('Next Stop')
        .or(this.page.getByText('No route assigned for today.')),
    ).toBeVisible();
  }

  get driverNav(): Locator {
    return this.page.getByRole('navigation', { name: 'Driver navigation' });
  }

  get startRouteButton(): Locator {
    return this.page.getByRole('button', { name: 'Start Route' });
  }

  get continueRouteLink(): Locator {
    return this.page.getByRole('link', { name: /Continue Route|View Route/ });
  }

  get progressBar(): Locator {
    return this.page.getByRole('progressbar');
  }
}

export class DriverRoutePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get startRouteButton(): Locator {
    return this.page.getByRole('button', { name: 'Start Route' });
  }

  get completeRouteButton(): Locator {
    return this.page.getByRole('button', { name: /Complete Route/ });
  }

  /**
   * 'Open' links on stop rows → /driver/stops/:stopId. Real sibling links
   * alongside the row's map-select button; exact name avoids the map's
   * 'OpenStreetMap contributors' attribution anchor.
   */
  get stopOpenLinks(): Locator {
    return this.page.getByRole('link', { name: 'Open', exact: true });
  }
}

export class DriverStopPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get enRouteButton(): Locator {
    return this.page.getByRole('button', { name: 'En Route' });
  }

  get arrivedButton(): Locator {
    return this.page.getByRole('button', { name: 'Arrived' });
  }

  get startWorkButton(): Locator {
    return this.page.getByRole('button', { name: 'Start Work' });
  }

  get completeStopButton(): Locator {
    return this.page.getByRole('button', { name: 'Complete Stop' });
  }

  get confirmCompletionButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Completion' });
  }

  get deferButton(): Locator {
    return this.page.getByRole('button', { name: 'Defer Stop' });
  }

  get failButton(): Locator {
    return this.page.getByRole('button', { name: 'Mark Failed' });
  }

  get reasonSelect(): Locator {
    return this.page.getByLabel('Reason');
  }

  get confirmDeferButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Defer' });
  }

  get confirmFailButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Failed' });
  }

  get backToRoute(): Locator {
    return this.page.getByRole('link', { name: 'Back to Route' });
  }
}
