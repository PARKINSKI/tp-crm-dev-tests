import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';
import {
  DriverHomePage,
  DriverRoutePage,
  DriverStopPage,
} from '../../pages/DriverPage';
import { isSupabase } from '../../config/env';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * Driver workflow — mobile-first shell. These specs only run in the
 * mobile-chrome project (see playwright.config.ts).
 *
 * Mock mode exercises the in-memory demo route; supabase mode requires a
 * field_user account with an assigned route (dev-driver-workflow-seed.sql).
 */
test.describe('driver workflow', () => {
  // Multi-step mobile workflow — needs headroom over the 30s default.
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    if (isSupabase) await loginAs(page, 'fieldUser');
  });

  /** Clicks whichever stop-workflow button is currently offered. */
  async function advanceStop(page: Page): Promise<void> {
    const stop = new DriverStopPage(page);
    const tryClick = async (locator: Locator) => {
      try {
        await locator.waitFor({ state: 'visible', timeout: 1500 });
        await locator.click();
        return true;
      } catch {
        return false;
      }
    };
    if (await tryClick(stop.enRouteButton)) return;
    if (await tryClick(stop.arrivedButton)) return;
    if (await tryClick(stop.startWorkButton)) return;
  }

  async function openFirstOpenableStop(page: Page): Promise<boolean> {
    const route = new DriverRoutePage(page);
    const links = route.stopOpenLinks;
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      // NOTE: the app renders 'Open' <a> inside the row <button> — nested
      // interactive elements, so click() hits the row. Navigate via href.
      const href = await links.nth(i).getAttribute('href');
      await page.goto(href!);
      const stop = new DriverStopPage(page);
      const actionable = await stop.enRouteButton
        .or(stop.arrivedButton)
        .or(stop.startWorkButton)
        .or(stop.completeStopButton)
        .or(stop.deferButton)
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() => true)
        .catch(() => false);
      if (actionable) return true;
      await page.goBack();
      await page.waitForURL(/\/driver\/routes\/.+/);
    }
    return false;
  }

  test('driver home shows the assigned route @driver', async ({ page }) => {
    const home = new DriverHomePage(page);
    await home.goto();
    await expectNoAppError(page);

    await expect(home.driverNav).toBeVisible();

    const nextStop = page.getByText('Next Stop');
    if (await nextStop.isVisible().catch(() => false)) {
      await expect(home.progressBar).toBeVisible();
      await expect(
        home.startRouteButton.or(home.continueRouteLink),
      ).toBeVisible();
    }
  });

  test('co-branding renders in the mobile driver shell @driver', async ({
    page,
    preset,
  }) => {
    const home = new DriverHomePage(page);
    await home.goto();
    await expectNoAppError(page);

    // Organisation name leads the mobile banner; bottom nav intact.
    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible();
    if (isSupabase) {
      await expect(banner).toContainText(/\S/);
    } else {
      await expect(banner).toContainText(preset.organisationName);
    }
    await expect(home.driverNav).toBeVisible();
  });

  test('a stop can be driven through its workflow @driver', async ({
    page,
  }) => {
    const home = new DriverHomePage(page);
    await home.goto();

    if (!(await page.getByText('Next Stop').isVisible().catch(() => false))) {
      test.skip(true, 'no route assigned to the current driver');
    }

    // Start or continue the route.
    if (await home.startRouteButton.isVisible().catch(() => false)) {
      await home.startRouteButton.click();
    } else {
      await home.continueRouteLink.click();
    }
    await page.waitForURL(/\/driver\/routes\/.+/);
    await expectNoAppError(page);

    if (!(await openFirstOpenableStop(page))) {
      test.skip(true, 'all stops on this route are already resolved');
    }

    // Drive the stop through depart → arrive → start work → complete.
    await advanceStop(page);
    await advanceStop(page);
    await advanceStop(page);

    const stop = new DriverStopPage(page);
    await expect(stop.completeStopButton, 'Complete Stop offered')
      .toBeVisible();
    await stop.completeStopButton.click();
    await stop.confirmCompletionButton.click();

    // Terminal outcome card renders the completion details.
    await expect(
      page.getByRole('link', { name: 'Back to Route' }),
    ).toBeVisible();
    await expectNoAppError(page);
  });

  test('a stop can be deferred with a reason @driver', async ({ page }) => {
    const home = new DriverHomePage(page);
    await home.goto();

    if (!(await page.getByText('Next Stop').isVisible().catch(() => false))) {
      test.skip(true, 'no route assigned to the current driver');
    }

    if (await home.startRouteButton.isVisible().catch(() => false)) {
      await home.startRouteButton.click();
      await page.waitForURL(/\/driver\/routes\/.+/);
    } else {
      await home.continueRouteLink.click();
      await page.waitForURL(/\/driver\/routes\/.+/);
    }

    if (!(await openFirstOpenableStop(page))) {
      test.skip(true, 'all stops on this route are already resolved');
    }

    // Defer only appears once the stop is arrived/in-progress.
    await advanceStop(page);
    await advanceStop(page);

    const stop = new DriverStopPage(page);
    await expect(stop.deferButton).toBeVisible();
    await stop.deferButton.click();
    await stop.reasonSelect.selectOption('Customer unavailable');
    await stop.confirmDeferButton.click();

    await expect(
      page.getByRole('link', { name: 'Back to Route' }),
    ).toBeVisible();
    await expectNoAppError(page);
  });
});
