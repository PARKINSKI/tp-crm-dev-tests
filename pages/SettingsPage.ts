import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Settings screen — the customer-facing settings surface: organisation,
 * users & roles, pricing, branding, units (read-only reference),
 * integrations, system status (supabase owner/admin only) and about.
 */
export class SettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * The section chip strip above the section content — all chip buttons,
   * located via the always-present 'Organisation' chip's container.
   */
  get sectionChips(): Locator {
    return this.sectionChip('Organisation').locator('..').getByRole('button');
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

  /** Section chip, e.g. 'Organisation', 'Units', 'Integrations'. */
  sectionChip(name: string): Locator {
    return this.main.getByRole('button', { name, exact: true });
  }

  async selectSection(name: string): Promise<void> {
    await this.sectionChip(name).click();
  }

  /**
   * Value cell of an info row, located by its row label, e.g.
   * rowValue('Organisation Name'). Rows are label/value sibling divs, so the
   * value is the element after the label's parent container child. Labels are
   * restricted to divs — section chips (buttons) can share the same text.
   */
  rowValue(label: string): Locator {
    return this.main
      .getByText(label, { exact: true })
      .and(this.main.locator('div'))
      .first()
      .locator('..')
      .locator('> *')
      .nth(1);
  }

  async expectRowValue(label: string, value: string | RegExp): Promise<void> {
    await expect(this.rowValue(label)).toHaveText(value);
  }
}
