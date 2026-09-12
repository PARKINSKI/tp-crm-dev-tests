import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Settings screen — a read-only view of the active client preset:
 * organisation, branding, terminology, navigation order, users, feature
 * flags, statuses, units and integrations.
 */
export class SettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** "Active Preset: <id>" badge in the page header. */
  get activePresetBadge(): Locator {
    return this.main.getByText(/^Active Preset:/);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(
      this.main.getByRole('heading', { name: 'Settings' }),
    ).toBeVisible();
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
    await this.waitForReady();
  }

  /** Section chip, e.g. 'Organisation', 'Units', 'Features'. */
  sectionChip(name: string): Locator {
    return this.main.getByRole('button', { name, exact: true });
  }

  async selectSection(name: string): Promise<void> {
    await this.sectionChip(name).click();
  }

  /**
   * Value cell of an info row, located by its row label, e.g.
   * rowValue('Organisation Name'). Rows are label/value sibling divs, so the
   * value is the element after the label's parent container child.
   */
  rowValue(label: string): Locator {
    return this.main
      .getByText(label, { exact: true })
      .first()
      .locator('..')
      .locator('> *')
      .nth(1);
  }

  async expectRowValue(label: string, value: string | RegExp): Promise<void> {
    await expect(this.rowValue(label)).toHaveText(value);
  }
}
