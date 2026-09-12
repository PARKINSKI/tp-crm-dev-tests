import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The shared CRM shell: sidebar with branding, primary navigation and the
 * user/account section, plus the top header with the current page title.
 */
export class AppShellPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.sidebar).toBeVisible();
  }

  /** Primary navigation inside the sidebar. */
  get navigation(): Locator {
    return this.sidebar.getByRole('navigation');
  }

  /**
   * Product logo image in the sidebar brand area. Uses a tag selector because
   * the logo has an empty alt attribute, making it presentational — role-based
   * 'img' lookups would match the SVG nav icons instead.
   */
  get logo(): Locator {
    return this.sidebar.locator('img').first();
  }

  /** Container holding the product name and organisation name text. */
  private get brandTextContainer(): Locator {
    return this.logo.locator('..').locator('> div');
  }

  /** Product/brand name shown under the logo, e.g. "TP Operations Platform". */
  get productName(): Locator {
    return this.brandTextContainer.locator('> div').first();
  }

  /** Organisation name shown under the product name. */
  get organisationName(): Locator {
    return this.brandTextContainer.locator('> div').nth(1);
  }

  /** User/account block at the bottom of the sidebar. */
  get userSection(): Locator {
    return this.signOutButton.locator('..');
  }

  get signOutButton(): Locator {
    return this.sidebar.getByRole('button', { name: /sign out/i });
  }

  /** All sidebar navigation links, in rendered order. */
  get navLinks(): Locator {
    return this.navigation.getByRole('link');
  }

  /**
   * Nav link by accessible name. Note: some presets render duplicate labels
   * (e.g. wasteDemo has two "Waste Transfer Notes" links) — prefer
   * navLinkByHref when the label may not be unique.
   */
  navItem(label: string): Locator {
    return this.navigation.getByRole('link', { name: label, exact: true });
  }

  /** Nav link by route — unambiguous even when labels repeat. */
  navLinkByHref(href: string): Locator {
    return this.navigation.locator(`a[href="${href}"]`);
  }

  async navigateTo(label: string): Promise<void> {
    await this.navItem(label).click();
  }

  async expectNavigationItem(label: string): Promise<void> {
    await expect(this.navItem(label)).toBeVisible();
  }

  async expectNavigationItemNotVisible(label: string): Promise<void> {
    await expect(this.navItem(label)).toBeHidden();
  }
}
