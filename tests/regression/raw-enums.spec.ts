import { expect, test } from '../../fixtures/base';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * Raw enum regression — user-facing screens must never show raw database /
 * config tokens such as `in_progress` or `field_user`. Scoped to visible
 * main-content text on key pages rather than a global DOM scrape.
 */
const RAW_ENUM_TOKENS = [
  'in_progress',
  'field_user',
  'retry_scheduled',
  'missing_pricing',
  'en_route',
  'waste_transfer_note',
];

const PAGES: { name: string; path: string }[] = [
  { name: 'dashboard', path: '/' },
  { name: 'customers', path: '/customers' },
  { name: 'bookings', path: '/bookings' },
  { name: 'jobs', path: '/jobs' },
  { name: 'routes', path: '/routes' },
  { name: 'documents', path: '/documents' },
  { name: 'reports', path: '/reports' },
  { name: 'notifications', path: '/notifications' },
  { name: 'settings', path: '/settings' },
];

test.describe('raw enum labels', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  for (const target of PAGES) {
    test(`no raw enum tokens visible on ${target.name}`, async ({ page }) => {
      await page.goto(target.path);
      await page.waitForLoadState('load');
      await expectNoAppError(page);

      const text = await page.getByRole('main').innerText();
      for (const token of RAW_ENUM_TOKENS) {
        expect(
          text.includes(token),
          `"${token}" leaked into the ${target.name} UI`,
        ).toBe(false);
      }
    });
  }

  /**
   * Regression: New Booking > drop-off branch must render the preset
   * terminology label ("Select a Site" etc.), not the raw key
   * `serviceLocation`. Previously shipped broken; now fixed in the app.
   */
  test('new booking form does not render raw terminology keys', async ({
    page,
  }) => {
    await page.goto('/bookings/new');
    await page.waitForLoadState('load');

    await page.getByText('DROP-OFF', { exact: true }).click();

    await expect(
      page.getByText('serviceLocation', { exact: false }),
    ).toHaveCount(0);
  });
});
