import { isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import {
  CustomerFormModal,
  CustomersPage,
} from '../../pages/CustomersPage';
import { loginAs } from '../../utils/auth';

/**
 * Basic accessibility-friendly assertions — not a full a11y audit.
 */
test.describe('accessibility basics', () => {
  test('notification bell and global controls have accessible names', async ({
    appShell,
    page,
  }) => {
    await loginAs(page, 'owner');
    await appShell.goto('/');

    await expect(appShell.notificationBell).toHaveAttribute(
      'aria-label',
      /^Notifications/,
    );
    await expect(page.getByLabel('Global search')).toBeVisible();
    await expect(
      appShell.sidebar.getByRole('button', { name: /sign out/i }),
    ).toBeVisible();

    // The bell dropdown exposes a labelled menu landmark.
    await appShell.notificationBell.click();
    await expect(
      page.getByRole('menu', { name: 'Notifications' }),
    ).toBeVisible();
  });

  test('form controls are labelled (customer modal)', async ({
    page,
  }) => {
    await loginAs(page, 'owner');
    const customers = new CustomersPage(page);
    await customers.goto();

    await customers.addCustomerButton.click();
    const modal = new CustomerFormModal(page);
    await expect(modal.nameInput).toBeVisible();
    await expect(modal.statusSelect).toBeVisible();
    await expect(page.locator('form').getByLabel('Postcode')).toBeVisible();
    await page.locator('form').getByRole('button', { name: 'Cancel' }).click();
  });

  test('login form controls are labelled', async ({ page }) => {
    test.skip(!isSupabase, 'mock mode redirects /login to the app');
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Sign in', exact: true }),
    ).toBeVisible();
  });

  /**
   * KNOWN A11Y GAP — OrganisationBranding (Settings > Branding) renders
   * <label> elements without htmlFor/id wiring, so getByLabel cannot
   * associate them. Expected to fail until the app wires the labels.
   * Supabase mode only — mock mode shows a read-only info card.
   */
  test('branding form controls have programmatic labels', async ({
    page,
  }) => {
    test.fail();
    test.skip(!isSupabase, 'branding form is supabase-only');
    await loginAs(page, 'owner');
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Branding', exact: true }).click();

    await expect(page.getByLabel('Primary Colour')).toBeVisible();
    await expect(page.getByLabel('Accent Colour')).toBeVisible();
    await expect(page.getByLabel('Secondary Colour')).toBeVisible();
  });

  /**
   * KNOWN A11Y GAP — the app's modals are plain divs without dialog
   * semantics (modalOverlay/modal CSS-module classes, no role="dialog" or
   * accessible name). Expected to fail until modals gain dialog roles.
   */
  test('modals expose dialog semantics', async ({ page }) => {
    test.fail();
    await loginAs(page, 'owner');
    const customers = new CustomersPage(page);
    await customers.goto();

    await customers.addCustomerButton.click();
    await expect(
      page.getByRole('dialog', { name: 'New Customer' }),
    ).toBeVisible();
  });
});
