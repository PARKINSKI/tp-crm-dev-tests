import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ListPage } from './ListPage';

export class CustomersPage extends ListPage {
  protected readonly path = '/customers';

  constructor(page: Page) {
    super(page);
  }

  get addCustomerButton(): Locator {
    return this.main.getByRole('button', { name: '+ Add Customer' });
  }

  get searchInput(): Locator {
    return this.main.getByLabel('Search');
  }

  async openFirstCustomer(): Promise<void> {
    await this.openFirstRow();
    await this.page.waitForURL(/\/customers\/.+/);
  }
}

/** '+ Add Customer' / 'Edit Customer' modal — labelled form fields. */
export class CustomerFormModal {
  constructor(private readonly page: Page) {}

  private get form(): Locator {
    return this.page.locator('form');
  }

  get nameInput(): Locator {
    return this.form.getByLabel('Customer Name *');
  }

  get referenceInput(): Locator {
    return this.form.getByLabel('Reference');
  }

  get statusSelect(): Locator {
    return this.form.getByLabel('Status');
  }

  get createButton(): Locator {
    return this.form.getByRole('button', { name: 'Create Customer' });
  }

  get saveButton(): Locator {
    return this.form.getByRole('button', { name: 'Save Customer' });
  }

  async create(name: string, reference: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.referenceInput.fill(reference);
    await this.createButton.click();
  }
}

export class CustomerDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.main.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Detail tab, e.g. 'Overview', 'Bookings', 'Communications'. */
  tab(name: string): Locator {
    return this.main.getByRole('button', { name, exact: true });
  }

  async selectTab(name: string): Promise<void> {
    await this.tab(name).click();
  }

  get editCustomerButton(): Locator {
    return this.main.getByRole('button', { name: 'Edit Customer' });
  }

  /** Supabase mode only (non-archived customers). */
  get archiveCustomerButton(): Locator {
    return this.main.getByRole('button', { name: 'Archive Customer' });
  }

  get addSiteButton(): Locator {
    return this.main.getByRole('button', { name: '+ Add Site' });
  }

  /**
   * The Communications card (Communications tab). The tab button itself also
   * matches the title text, so take the last occurrence — the card title.
   */
  get communicationsCard(): Locator {
    return this.main
      .getByText('Communications', { exact: true })
      .last()
      .locator('..');
  }
}

/** '+ Add Site' / 'Edit Site' modal — includes postcode geocoding. */
export class SiteFormModal {
  constructor(private readonly page: Page) {}

  private get form(): Locator {
    return this.page.locator('form');
  }

  get nameInput(): Locator {
    return this.form.getByLabel(/Site Name/);
  }

  get postcodeInput(): Locator {
    return this.form.getByLabel(/Postcode/);
  }

  get submitButton(): Locator {
    return this.form.getByRole('button', { name: /Add Site|Create Site|Save Site/ });
  }
}
