import { expect, test } from '../../fixtures/base';
import {
  BookingDetailPage,
  BookingsPage,
} from '../../pages/BookingsPage';
import { expectNoAppError } from '../../utils/errors';

test.describe('bookings', () => {
  test('list renders summary cards and booking rows', async ({
    appShell,
    page,
    preset,
  }) => {
    const bookings = new BookingsPage(page);
    await bookings.goto();

    await appShell.expectPageHeading(preset.terms.booking.plural);
    await expectNoAppError(page);

    for (const label of [
      'Awaiting Planning',
      'Scheduled',
      'In Progress',
      'Completed Today',
    ]) {
      await expect(bookings.summaryCard(label), `summary "${label}"`).toBeVisible();
    }

    await bookings.expectRows();
  });

  test('a booking opens showing its core details', async ({ page }) => {
    const bookings = new BookingsPage(page);
    await bookings.goto();
    await bookings.openFirstBooking();

    const detail = new BookingDetailPage(page);
    await detail.waitForReady();
    await expectNoAppError(page);
    await expect(
      detail.main.getByRole('heading', { level: 1 }),
    ).toContainText(/\S/);

    for (const card of [
      'Status Progress',
      'Customer / Site Details',
      'Booking Details',
    ]) {
      await expect(detail.cardWithTitle(card), `card "${card}"`).toBeVisible();
    }
  });
});
