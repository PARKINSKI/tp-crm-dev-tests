import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ListPage } from './ListPage';
import { exactText } from '../utils/locators';

export class BookingsPage extends ListPage {
  protected readonly path = '/bookings';

  constructor(page: Page) {
    super(page);
  }

  /** Summary card located by its label, e.g. "Awaiting Planning". */
  summaryCard(label: string): Locator {
    return this.main
      .locator('div')
      .filter({ hasText: exactText(label) })
      .locator('..');
  }

  get newBookingButton(): Locator {
    return this.main.getByRole('button', { name: '+ New Booking' });
  }

  async openFirstBooking(): Promise<void> {
    await this.openFirstRow();
    await this.page.waitForURL(/\/bookings\/.+/);
  }
}

export class BookingDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.main.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** 'Create Job' (supabase) — converts the booking into a job. */
  get createJobButton(): Locator {
    return this.main.getByRole('button', { name: 'Create Job' });
  }

  /** 'Plan Job' — sends the booking to dispatch planning. */
  get planJobButton(): Locator {
    return this.main.getByRole('button', { name: 'Plan Job' });
  }

  get editButton(): Locator {
    return this.main.getByRole('button', { name: 'Edit Booking' });
  }

  get cancelButton(): Locator {
    return this.main.getByRole('button', { name: 'Cancel Booking' });
  }
}

/** /bookings/new — multi-section booking creation form (supabase mode). */
export class NewBookingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/bookings/new');
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(
      this.main.getByRole('heading', { name: 'New Booking' }),
    ).toBeVisible();
  }

  /** Booking type card, e.g. 'SITE VISIT' / 'DROP-OFF' — clickable divs. */
  typeCard(name: string): Locator {
    return this.main.getByText(name, { exact: true });
  }

  get customerSearch(): Locator {
    return this.main.getByPlaceholder(
      'Search customer, site, customer reference, postcode or telephone',
    );
  }

  /** A customer search result option. */
  customerOption(name: string | RegExp): Locator {
    return this.main.getByRole('button', { name });
  }

  get requestDateInput(): Locator {
    return this.main.getByLabel('Request Date');
  }

  get prioritySelect(): Locator {
    return this.main.getByLabel('Priority');
  }

  get internalNotesInput(): Locator {
    return this.main.getByLabel('Internal Notes');
  }

  get createButton(): Locator {
    return this.main.getByRole('button', { name: 'Create Booking' });
  }

  get formError(): Locator {
    return this.main.getByRole('alert');
  }
}
