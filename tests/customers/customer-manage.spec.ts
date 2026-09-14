import { expect, test } from '../../fixtures/base';
import {
  CustomerDetailPage,
  CustomerFormModal,
  CustomersPage,
  SiteFormModal,
} from '../../pages/CustomersPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';
import { uniqueRef } from '../../utils/testData';

/**
 * Customer/site write-path coverage — supabase mode only (mock repositories
 * throw on writes). Created records use the E2E-* prefix; each test archives
 * its own customer afterwards where the UI supports it.
 */
test.describe('customer management', () => {
  test.beforeEach(async ({ page }) => {
    requireSupabase();
    await loginAs(page, 'owner');
  });

  test('create a customer, then edit it', async ({ page }) => {
    const name = uniqueRef('CUST');
    const customers = new CustomersPage(page);
    await customers.goto();

    await customers.addCustomerButton.click();
    const modal = new CustomerFormModal(page);
    await modal.create(name, name);

    // Modal closes and the new customer is findable via search.
    await expect(modal.createButton).toBeHidden();
    await customers.searchInput.fill(name);
    const row = customers.rows.filter({ hasText: name }).first();
    await expect(row).toBeVisible();

    // Open it, then edit via the same modal.
    await row.click();
    const detail = new CustomerDetailPage(page);
    await detail.waitForReady();
    await expect(detail.heading).toContainText(name);

    await detail.editCustomerButton.click();
    const editModal = new CustomerFormModal(page);
    await editModal.nameInput.fill(`${name} Ltd`);
    await editModal.saveButton.click();
    await expect(detail.heading).toContainText(`${name} Ltd`);

    // Cleanup: archive the test customer (accepts the confirm dialog).
    page.once('dialog', (d) => void d.accept());
    await detail.archiveCustomerButton.click();
    await expect(
      detail.main.getByText('Archived').first(),
    ).toBeVisible();
  });

  test('create a site on an existing customer', async ({ page }) => {
    const customers = new CustomersPage(page);
    await customers.goto();
    await customers.openFirstCustomer();

    const detail = new CustomerDetailPage(page);
    await detail.waitForReady();
    await expectNoAppError(page);

    const siteName = uniqueRef('SITE');
    await detail.addSiteButton.click();
    const siteModal = new SiteFormModal(page);
    await siteModal.nameInput.fill(siteName);
    await siteModal.postcodeInput.fill('SA1 8QY');
    // Leaving the postcode field auto-runs the geocode lookup, which inserts
    // a status line and shifts the footer — settle it before clicking submit.
    await siteModal.postcodeInput.press('Tab');
    await expect(
      page.getByRole('status').filter({
        hasText: /location found|not found|unable to look up/i,
      }),
    ).toBeVisible();
    await siteModal.submitButton.click();

    await expect(siteModal.submitButton).toBeHidden();
    await expect(detail.main.getByText(siteName)).toBeVisible();

    // Cleanup: archive the site (accepts the confirm dialog). Sites render
    // as cards, not table rows — scope by the card containing the name.
    const siteCard = detail.main
      .locator('div')
      .filter({ has: page.getByText(siteName) })
      .filter({ has: page.getByRole('button', { name: 'Archive' }) })
      .last();
    page.once('dialog', (d) => void d.accept());
    await siteCard.getByRole('button', { name: 'Archive' }).click();
    await expect(siteCard.getByText('Archived').first()).toBeVisible();
  });

  test('invalid postcode surfaces a location warning', async ({ page }) => {
    const customers = new CustomersPage(page);
    await customers.goto();
    await customers.openFirstCustomer();

    const detail = new CustomerDetailPage(page);
    await detail.waitForReady();

    await detail.addSiteButton.click();
    const siteModal = new SiteFormModal(page);
    await siteModal.postcodeInput.fill('ZZ9 9ZZ');
    await page.getByRole('button', { name: 'Find Location' }).click();

    // The page has other role="status" live regions (e.g. map loading) —
    // target the postcode/location feedback specifically.
    await expect(
      page.getByRole('status').filter({ hasText: /postcode|location/i }),
    ).toBeVisible();

    // Close without saving — nothing created.
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
