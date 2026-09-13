import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** /notifications — full notifications list with filters. */
export class NotificationsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/notifications');
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(
      this.main.getByRole('heading', { name: 'Notifications' }),
    ).toBeVisible();
  }

  /**
   * Status filter chip: 'All' | 'Unread' | 'Open' | 'Resolved'. Scoped to the
   * chip row (sibling of the type filter) because 'Open' also names per-item
   * action buttons.
   */
  filterChip(name: string): Locator {
    return this.typeFilter
      .locator('..')
      .getByRole('button', { name, exact: true });
  }

  get typeFilter(): Locator {
    return this.main.getByLabel('Filter by type');
  }

  get markAllReadButton(): Locator {
    return this.main.getByRole('button', { name: 'Mark all as read' });
  }

  /** A notification card containing the given title text. */
  notification(title: string | RegExp): Locator {
    return this.main
      .getByText(title)
      .first()
      .locator('..')
      .locator('..');
  }

  /** The first notification card in the list. */
  get firstItem(): Locator {
    return this.main
      .getByRole('button', { name: 'Dismiss' })
      .first()
      .locator('..');
  }
}
