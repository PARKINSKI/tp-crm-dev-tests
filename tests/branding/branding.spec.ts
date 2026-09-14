import type { Page } from '@playwright/test';
import { env, isSupabase, type RoleKey } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { SettingsPage } from '../../pages/SettingsPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * Co-branding coverage: the client organisation is the visual identity;
 * "Powered by TP Interactive" remains as the subtle vendor credit.
 */

const POWERED_BY = /Powered by\s+TP Interactive/i;

/**
 * Colour text inputs in Organisation Branding — labels are htmlFor-wired to
 * the text field; each field also has a sibling `type="color"` picker whose
 * accessible name is "<label> picker", so exact matching is required.
 */
function brandingInput(page: Page, label: string) {
  return page.getByLabel(label, { exact: true });
}

test.describe('co-branding', { tag: ['@branding', '@regression'] }, () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('"Powered by" vendor credit is visible in the app shell', async ({
    appShell,
    page,
  }) => {
    await appShell.goto('/');
    await expectNoAppError(page);

    await expect(
      appShell.sidebar.getByText(POWERED_BY),
    ).toBeVisible();
  });

  test('"Powered by" appears on the sign-in page', async ({ browser }) => {
    test.skip(!isSupabase, 'mock mode redirects /login into the app');
    // beforeEach authenticates this context — the sign-in page needs an
    // unauthenticated one (loginAs' init scripts re-seed on navigation).
    const ctx = await browser.newContext({ baseURL: env.baseUrl });
    const page = await ctx.newPage();
    try {
      await page.goto('/login');
      await expect(
        page.getByRole('button', { name: 'Sign in', exact: true }),
      ).toBeVisible();
      await expect(page.getByText(POWERED_BY)).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('organisation identity is primary in the app shell', async ({
    appShell,
    page,
    preset,
  }) => {
    await appShell.goto('/');

    await expect(appShell.organisationName).toBeVisible();
    await expect(appShell.productName).toBeVisible();

    if (isSupabase) {
      // Seeded E2E org name is environment-specific — assert the brand block
      // leads with an organisation, not the product name.
      const org = (await appShell.organisationName.textContent())?.trim();
      const product = (await appShell.productName.textContent())?.trim();
      expect(org, 'organisation name is populated').toBeTruthy();
      expect(org).not.toBe(product);
    } else {
      await expect(appShell.organisationName).toHaveText(
        preset.organisationName,
      );
      await expect(appShell.productName).toHaveText(preset.productName);
    }
  });

  test('Branding settings shows customer-facing controls', async ({
    settings,
    page,
    preset,
  }) => {
    await settings.goto();
    await settings.selectSection('Branding');
    await expectNoAppError(page);

    if (isSupabase) {
      await expect(
        page.getByText('Organisation Branding', { exact: true }),
      ).toBeVisible();
      for (const label of [
        'Organisation Logo',
        'Primary Colour',
        'Accent Colour',
        'Secondary Colour',
        'Preview',
      ]) {
        await expect(
          page.getByText(label, { exact: true }).first(),
          `label "${label}"`,
        ).toBeVisible();
      }
      // Owner: management controls + colour inputs enabled.
      await expect(brandingInput(page, 'Primary Colour')).toBeEnabled();
      await expect(
        page.getByRole('button', { name: 'Save Branding' }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Reset to defaults' }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Upload Logo' }),
      ).toBeVisible();
      // The preview carries the vendor credit.
      await expect(page.getByText(POWERED_BY).last()).toBeVisible();
      return;
    }

    // Mock mode: read-only preview card of the fictional org's branding.
    await expect(
      page.getByText('Organisation Branding', { exact: true }),
    ).toBeVisible();
    await settings.expectRowValue('Organisation', preset.organisationName);
    await settings.expectRowValue('Primary Colour', preset.primaryColour);
    await expect(
      page.getByText(/customisation is available for live organisations/i),
    ).toBeVisible();
    // No edit controls in demo mode.
    await expect(
      page.getByRole('button', { name: 'Save Branding' }),
    ).toHaveCount(0);
  });

  test('About section shows product, version and vendor', async ({
    settings,
    page,
    preset,
  }) => {
    await settings.goto();
    await settings.selectSection('About');

    await settings.expectRowValue('Product', preset.productName);
    await settings.expectRowValue('Vendor', POWERED_BY);
    if (!isSupabase) {
      await settings.expectRowValue('Organisation', preset.organisationName);
    }
  });

  // Developer-implementation leakage is covered unconditionally by
  // tests/regression/prototype-leakage.spec.ts.
});

test.describe('branding role access', { tag: ['@branding', '@admin'] }, () => {
  const EDIT_ROLES: RoleKey[] = ['owner', 'admin'];
  const READ_ONLY_ROLES: RoleKey[] = ['manager', 'office', 'viewer', 'fieldUser'];

  for (const role of EDIT_ROLES) {
    test(`${role} can edit organisation branding`, async ({ page }) => {
      requireSupabase();
      await loginAs(page, role);
      const settings = new SettingsPage(page);
      await settings.goto();
      await settings.selectSection('Branding');

      await expect(brandingInput(page, 'Primary Colour')).toBeEnabled();
      await expect(
        page.getByRole('button', { name: 'Save Branding' }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Upload Logo' }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Reset to defaults' }),
      ).toBeVisible();
    });
  }

  for (const role of READ_ONLY_ROLES) {
    test(`${role} sees read-only branding`, async ({ page }) => {
      requireSupabase();
      await loginAs(page, role);
      const settings = new SettingsPage(page);
      await settings.goto();
      await settings.selectSection('Branding');

      await expect(brandingInput(page, 'Primary Colour')).toBeDisabled();
      await expect(
        page.getByRole('button', { name: 'Save Branding' }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Upload Logo' }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Reset to defaults' }),
      ).toHaveCount(0);
      await expect(
        page.getByText(
          'Only organisation owners and admins can change branding.',
        ),
      ).toBeVisible();
    });
  }
});

test.describe('branding persistence', { tag: ['@branding', '@regression'] }, () => {
  const SAFE_COLOUR = '#3355aa';

  test('saved branding persists across reload and resets to defaults', async ({
    page,
    preset,
  }) => {
    // Performs three real writes plus a reload against hosted Supabase —
    // legitimately slower than a single-assertion test.
    test.slow();
    requireSupabase();
    await loginAs(page, 'owner');
    const settings = new SettingsPage(page);
    await settings.goto();

    // The form fetches org settings on mount — a late-resolving load would
    // clobber a typed value, so wait for the fetch before editing.
    const settingsLoaded = page.waitForResponse(
      (r) =>
        r.url().includes('organisation_settings') &&
        r.request().method() === 'GET',
    );
    await settings.selectSection('Branding');
    await settingsLoaded;
    // The form patches values in a .then after the response — wait for all
    // network to go quiet so the commit has landed before typing (a late
    // commit would clobber the fill back to the preset value).
    await page.waitForLoadState('networkidle');

    const primary = brandingInput(page, 'Primary Colour');
    const original = await primary.inputValue();

    try {
      await primary.fill(SAFE_COLOUR);
      await page.getByRole('button', { name: 'Save Branding' }).click();
      await expect(page.getByText('Branding saved.')).toBeVisible();

      // Persisted and re-applied after a hard refresh — the boot-time
      // branding load is deterministic, unlike the post-save refetch.
      await page.reload();
      await settings.waitForReady();
      await expect
        .poll(() =>
          page.evaluate(() =>
            getComputedStyle(document.documentElement)
              .getPropertyValue('--brand-primary')
              .trim(),
          ),
        )
        .toBe(SAFE_COLOUR);
      await settings.selectSection('Branding');
      await expect(brandingInput(page, 'Primary Colour')).toHaveValue(
        SAFE_COLOUR,
      );
    } finally {
      // Restore the original value before attempting reset assertions.
      // The Branding section may not be mounted (e.g. a failure before the
      // post-reload selectSection) — remount it and bound the read so
      // cleanup can't consume the whole test budget.
      if (!(await primary.isVisible().catch(() => false))) {
        await settings.selectSection('Branding').catch(() => undefined);
      }
      const current = await primary
        .inputValue({ timeout: 5_000 })
        .catch(() => null);
      if (current !== null && current !== original) {
        await primary.fill(original);
        await page.getByRole('button', { name: 'Save Branding' }).click();
        await expect(page.getByText('Branding saved.')).toBeVisible();
      }
    }

    // Reset to Defaults — confirm dialog → preset fallback restored.
    await primary.fill(SAFE_COLOUR);
    await page.getByRole('button', { name: 'Save Branding' }).click();
    await expect(page.getByText('Branding saved.')).toBeVisible();

    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: 'Reset to defaults' }).click();
    await expect(
      page.getByText('Branding reset to defaults.'),
    ).toBeVisible();
    // Reset clears the org override — the field falls back to the preset
    // palette value.
    await expect(brandingInput(page, 'Primary Colour')).toHaveValue(
      preset.primaryColour,
    );
  });
});
