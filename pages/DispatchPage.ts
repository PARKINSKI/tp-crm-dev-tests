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

  /** Side-panel title, e.g. 'Unrouted Jobs', 'Stops'. */
  panel(title: string): Locator {
    return this.main.getByText(title, { exact: true });
  }

  /**
   * The operations map (MapLibre). Asserts the rendered canvas — the map
   * container itself carries only a CSS-module class.
   */
  get map(): Locator {
    return this.main.locator('canvas').first();
  }

  /** Supabase mode only — opens the create-route modal. */
  get createRouteButton(): Locator {
    return this.main.getByRole('button', { name: 'Create Route', exact: true });
  }

  /** 'Add Job to Route' buttons on unrouted job cards. */
  get addJobButtons(): Locator {
    return this.main.getByRole('button', { name: 'Add Job to Route' });
  }
}
