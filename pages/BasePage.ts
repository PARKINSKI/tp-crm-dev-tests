import { expect, Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
    await this.waitForReady();
  }

  /** Waits until the page's initial document has finished loading. */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('load');
  }

  /** Main content landmark. */
  get main(): Locator {
    return this.page.getByRole('main');
  }

  /** Primary (h1) page heading. */
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** Current page title (h1) rendered in the top header. */
  get pageHeading(): Locator {
    return this.page.getByRole('banner').getByRole('heading', { level: 1 });
  }

  /** Application sidebar, rendered as an <aside> landmark. */
  get sidebar(): Locator {
    return this.page.getByRole('complementary');
  }

  /** A <section> identified by its heading text (h2/h3). */
  sectionWithHeading(title: string | RegExp): Locator {
    return this.main.getByRole('heading', { name: title }).locator('..');
  }

  /**
   * A card identified by its title text. Card titles are plain divs/h3s with
   * CSS-module classes, so the text itself is the stable hook.
   */
  cardWithTitle(title: string | RegExp): Locator {
    return this.main.getByText(title, { exact: true }).first().locator('..');
  }

  async expectPageHeading(name: string | RegExp): Promise<void> {
    await expect(
      this.page.getByRole('banner').getByRole('heading', { name }),
    ).toBeVisible();
  }

  /** Poll-free visibility check — useful for optional elements. */
  async isVisible(locator: Locator, timeout = 2_000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }
}
