import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';
import {
  BookingDetailPage,
  NewBookingPage,
} from '../../pages/BookingsPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';
import { uniqueRef } from '../../utils/testData';

/**
 * Booking write-path coverage — supabase mode only. Each test creates an
 * E2E-referenced booking and cancels/converts it before finishing so no
 * shared seed data is touched.
 */
test.describe('booking management', () => {
  test.beforeEach(async ({ page }) => {
    requireSupabase();
    await loginAs(page, 'owner');
  });

  /** Creates a minimal site-visit booking; lands on its detail page. */
  async function createBooking(page: Page, notes: string): Promise<void> {
    const form = new NewBookingPage(page);
    await form.goto();

    await form.customerSearch.fill('a');
    // Result options render as buttons "Name — REF — POSTCODE".
    await form.customerOption(/—/).first().click();
    await form.requestDateInput.fill(new Date().toISOString().slice(0, 10));
    await form.internalNotesInput.fill(notes);
    await form.createButton.click();

    await page.waitForURL(/\/bookings\/.+/);
    await new BookingDetailPage(page).waitForReady();
  }

  test('create a booking, then cancel it', async ({ page }) => {
    const marker = uniqueRef('BKG');
    await createBooking(page, marker);

    const detail = new BookingDetailPage(page);
    await expectNoAppError(page);
    await expect(detail.main.getByText(marker)).toBeVisible();

    // Cleanup: cancel the booking (accepts the confirm dialog).
    page.once('dialog', (d) => void d.accept());
    await detail.cancelButton.click();
    await expect(
      detail.main.getByText('Cancelled').first(),
    ).toBeVisible();
  });

  test('create a booking and convert it to a job', async ({ page }) => {
    const marker = uniqueRef('BKG');
    await createBooking(page, marker);

    const detail = new BookingDetailPage(page);
    await detail.createJobButton.click();

    // Conversion lands on the new job's detail page.
    await page.waitForURL(/\/jobs\/.+/);
    await expectNoAppError(page);
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1 }),
    ).toContainText(/\S/);
    await expect(
      page.getByRole('main').getByText(/Summary/).first(),
    ).toBeVisible();
  });
});
