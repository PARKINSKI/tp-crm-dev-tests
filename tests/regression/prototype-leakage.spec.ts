import { env, isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { SettingsPage } from '../../pages/SettingsPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * Prototype/developer leakage regression — customer-facing surfaces must
 * never expose implementation terms, internal preset identifiers or
 * developer diagnostics. Scoped to visible UI text on key screens rather
 * than a global DOM/source scan.
 */
const FORBIDDEN_TOKENS = [
  'VITE_CLIENT_PRESET',
  'VITE_DATA_MODE',
  'VITE_SUPABASE',
  'src/config/clients',
  'Active Preset',
  'PostgREST',
  'RLS',
  'JWT',
  'Edge Function',
  'Supabase project ref',
];

/**
 * Internal preset ids that must never render. Friendly words such as
 * "Waste", "Logistics" or "Field Service" are legitimate UI copy; 'demo' is
 * too generic to forbid as a token.
 */
const PRESET_IDS = ['wasteDemo', 'logisticsDemo', 'fieldServiceDemo'];

/** Settings sections removed from the customer-facing product. */
const REMOVED_SETTINGS_SECTIONS = [
  'Terminology',
  'Navigation',
  'Features',
  'Statuses',
  'Backend',
];

function expectNoForbiddenTokens(text: string, where: string): void {
  for (const token of [...FORBIDDEN_TOKENS, ...PRESET_IDS]) {
    expect(
      text.includes(token),
      `"${token}" leaked into the ${where} UI`,
    ).toBe(false);
  }
}

test.describe('prototype/developer leakage', { tag: '@regression' }, () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('dashboard shows no implementation terms or preset ids', async ({
    appShell,
    page,
  }) => {
    await appShell.goto('/');
    await expectNoAppError(page);

    expectNoForbiddenTokens(await page.locator('body').innerText(), 'dashboard');
  });

  test('settings shows no implementation terms or preset ids', async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    // Check every rendered section — internals could hide in any of them.
    const chips = (await settings.sectionChips.allInnerTexts()).map((c) =>
      c.trim(),
    );
    for (const chip of chips) {
      await settings.selectSection(chip);
      expectNoForbiddenTokens(
        await settings.main.innerText(),
        `settings > ${chip}`,
      );
    }
  });

  test('removed build-time settings sections are not offered', async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    for (const removed of REMOVED_SETTINGS_SECTIONS) {
      await expect(
        settings.sectionChip(removed),
        `removed section "${removed}"`,
      ).toHaveCount(0);
    }
  });

  test('sign-in screen shows no implementation terms', async ({ page }) => {
    requireSupabase();
    await page.goto('/login');
    await expect(
      page.getByRole('button', { name: 'Sign in', exact: true }),
    ).toBeVisible();

    expectNoForbiddenTokens(await page.locator('body').innerText(), 'login');
  });

  test('no navigation links point at prototype routes', async ({
    appShell,
    page,
  }) => {
    await appShell.goto('/');
    await expect(
      appShell.navigation.locator('a[href^="/prototype"]'),
    ).toHaveCount(0);
  });

  /**
   * /prototype/* routes are dev-build only (gated behind import.meta.env.DEV).
   * Against a production build (PROD_BUILD=1) they must 404; on a dev server
   * they intentionally remain reachable for internal review.
   */
  test('prototype routes are unreachable in production builds', async ({
    page,
  }) => {
    await page.goto('/prototype');
    await page.waitForLoadState('load');

    if (!env.isProdBuild) {
      // Dev server — the internal concept index intentionally renders.
      test.info().annotations.push({
        type: 'note',
        description:
          'dev build: /prototype is intentionally mounted (DEV-only surface)',
      });
      await expect(
        page.getByRole('heading', { name: 'Page not found' }),
      ).toHaveCount(0);
      return;
    }

    await expect(page).toHaveURL(/\/prototype/);
    await expect(
      page.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible();
    expectNoForbiddenTokens(await page.locator('body').innerText(), 'prototype');
  });
});
