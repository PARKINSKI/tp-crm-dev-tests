import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';
import { SettingsPage } from '../../pages/SettingsPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';
import {
  expectNoContainerHorizontalScroll,
  expectNoPageHorizontalOverflow,
} from '../../utils/layout';

/**
 * Responsive layout regression.
 *
 * Product contract: no page-level horizontal scrolling at any supported
 * width. Operational lists reflow — desktop tables drop dense columns at
 * <=1280px (hide-lg) and switch to cards at <=768px (show-sm/list-card);
 * `.table-scroll` is only a defensive fallback. Reports may keep contained
 * table scrolling — only page overflow is asserted there.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

const MOBILE = VIEWPORTS[2];

const CORE_PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Customers', path: '/customers' },
  { name: 'Bookings', path: '/bookings' },
  { name: 'Jobs', path: '/jobs' },
  { name: 'Routes', path: '/routes' },
  { name: 'Documents', path: '/documents' },
  { name: 'Reports', path: '/reports' },
  { name: 'Settings', path: '/settings' },
  { name: 'Notifications', path: '/notifications' },
] as const;

/** The global responsive utility hooks the app uses for list reflow. */
const desktopTable = (page: Page) => page.locator('.table-scroll').first();
const mobileCards = (page: Page) => page.locator('.show-sm .list-card');

test.describe('page-level horizontal overflow', { tag: '@responsive' }, () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  for (const viewport of VIEWPORTS) {
    for (const target of CORE_PAGES) {
      test(`${target.name} has no page overflow at ${viewport.name} (${viewport.width}px)`, async ({
        page,
      }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto(target.path);
        await expect(page.getByRole('main')).toBeVisible();
        await expectNoAppError(page);
        await expectNoPageHorizontalOverflow(page, target.name);
      });
    }
  }
});

test.describe('responsive list presentation', { tag: '@responsive' }, () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('bookings: mobile switches to cards with reachable actions', async ({
    page,
  }) => {
    // Desktop side (actions visible without scrolling) is covered by the
    // per-page container assertion below — bookings is the known defect.
    await page.setViewportSize(MOBILE);
    await page.goto('/bookings');
    await expect(desktopTable(page)).toBeHidden();
    await expect(mobileCards(page).first()).toBeVisible();
    await expect(
      mobileCards(page).first().getByRole('button', { name: 'View', exact: true }),
    ).toBeVisible();
    await expectNoPageHorizontalOverflow(page, 'bookings @mobile');
  });

  const CARD_PAGES = [
    { name: 'customers', path: '/customers', context: /Last \w+/ },
    { name: 'jobs', path: '/jobs', context: /\d{1,2} \w{3,9} \d{4}/ },
    { name: 'routes', path: '/routes', context: /\d+ stops/ },
    { name: 'documents', path: '/documents', context: null },
  ];

  for (const target of CARD_PAGES) {
    test(`${target.name}: mobile cards keep identity, status and primary action`, async ({
      page,
    }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(target.path);

      await expect(desktopTable(page)).toBeHidden();
      const card = mobileCards(page).first();
      await expect(card).toBeVisible();
      await expect(card).toContainText(/\S{3,}/);
      if (target.context) {
        await expect(card).toContainText(target.context);
      }
      await expect(
        card.getByRole('button', { name: 'View', exact: true }),
        `${target.name} card keeps a reachable View action`,
      ).toBeVisible();
      await expectNoPageHorizontalOverflow(page, `${target.name} @mobile`);
    });
  }

  test('routes: mobile card keeps route context and Dispatch action', async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/routes');
    const card = mobileCards(page).first();
    await expect(card).toBeVisible();
    // Route name/status/driver-or-vehicle context are inline in the card.
    await expect(card).toContainText(/\d+ stops/);
    await expect(card.getByRole('button', { name: 'View', exact: true })).toBeVisible();
    const dispatch = card.getByRole('button', { name: 'Dispatch' });
    if (await dispatch.isVisible().catch(() => false)) {
      await expect(dispatch).toBeEnabled();
    }
  });

  /**
   * The new product design reflows columns so the operational list itself
   * fits — `.table-scroll` is only a defensive fallback, not an expected
   * scrollbar at normal desktop width.
   *
   * KNOWN PRODUCT DEFECTS — bookings (~1379px table) and routes (~1406px)
   * overflow the ~1112px content area at 1440px: the container scrolls and
   * the Actions column is pushed off-screen. Expected to fail until those
   * tables reflow.
   */
  for (const target of [
    { name: 'customers', path: '/customers' },
    { name: 'bookings', path: '/bookings', knownDefect: true },
    { name: 'jobs', path: '/jobs' },
    { name: 'routes', path: '/routes', knownDefect: true },
    { name: 'documents', path: '/documents' },
  ]) {
    test(`desktop ${target.name} list does not scroll internally`, async ({
      page,
    }) => {
      if ('knownDefect' in target && target.knownDefect) test.fail();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(target.path);
      await expect(desktopTable(page), `${target.name} list`).toBeVisible();
      await expectNoContainerHorizontalScroll(desktopTable(page), target.name);
      await expect(mobileCards(page).first()).toBeHidden();
    });
  }

  test('bookings: header actions and filters stay in view at mobile', async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/bookings');
    await expect(
      page.getByRole('button', { name: /New Booking/i }).first(),
    ).toBeVisible();
    // Filter controls render inside the page without forcing overflow.
    await expectNoPageHorizontalOverflow(page, 'bookings header @mobile');
  });

  test('reports: dense tables allowed, page never overflows', async ({
    page,
  }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto('/reports');
      await expect(page.getByRole('main')).toBeVisible();
      await expectNoPageHorizontalOverflow(
        page,
        `reports @${viewport.name}`,
      );
    }
  });

  test('a modal fits the mobile viewport without page overflow', async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/customers');
    await page
      .getByRole('button', { name: /Add Customer/i })
      .first()
      .click();

    const dialog = page.getByRole('dialog', { name: 'New Customer' });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x, 'dialog starts inside the viewport').toBeGreaterThanOrEqual(
      0,
    );
    expect(
      box!.x + box!.width,
      'dialog right edge inside the viewport',
    ).toBeLessThanOrEqual(MOBILE.width + 1);
    await expectNoPageHorizontalOverflow(page, 'customer modal @mobile');
  });
});

test.describe('admin tables (supabase)', { tag: '@responsive' }, () => {
  test.beforeEach(async ({ page }) => {
    requireSupabase();
    await loginAs(page, 'owner');
  });

  test('users & roles: identity, role, status and actions stay reachable', async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await settings.goto();
      await settings.selectSection('Users & Roles');

      await expectNoPageHorizontalOverflow(
        page,
        `users & roles @${viewport.name}`,
      );
      // Owner: 'Invite User' + member role/status controls stay reachable.
      await expect(
        page.getByRole('button', { name: 'Invite User' }),
      ).toBeVisible();
      await expect(
        page
          .getByRole('button', {
            name: /Disable|Re-enable|Configure Field User/,
          })
          .or(page.getByRole('combobox', { name: /Change role for / }))
          .first(),
      ).toBeVisible();
    }

    // Desktop: the admin table container itself does not scroll.
    await page.setViewportSize({ width: 1440, height: 900 });
    await settings.selectSection('Users & Roles');
    if (await desktopTable(page).isVisible().catch(() => false)) {
      await expectNoContainerHorizontalScroll(
        desktopTable(page),
        'users & roles',
      );
    }
  });

  test('pricing rules: scope, price and actions stay reachable', async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await settings.goto();
      await settings.selectSection('Pricing');

      await expectNoPageHorizontalOverflow(page, `pricing @${viewport.name}`);
      // Owner: add + per-rule edit controls stay reachable at every width.
      await expect(
        page.getByRole('button', { name: 'Add Pricing Rule' }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Edit', exact: true }).first(),
      ).toBeVisible();
    }
  });
});
