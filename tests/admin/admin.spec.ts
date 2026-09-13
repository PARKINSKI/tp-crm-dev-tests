import { expect, test } from '../../fixtures/base';
import { SettingsPage } from '../../pages/SettingsPage';
import { loginAs, requireSupabase } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

/**
 * Organisation administration + role matrix — supabase mode only.
 * UI-level permission checks only; database RLS remains the real boundary.
 */
test.describe('administration', () => {
  test('owner sees organisation controls, user management and pricing admin', async ({
    page,
  }) => {
    requireSupabase();
    await loginAs(page, 'owner');
    const settings = new SettingsPage(page);
    await settings.goto();

    // Organisation: editable fields + save + system status.
    await expect(settings.main.getByLabel('Organisation Name')).toBeEnabled();
    await expect(
      settings.main.getByRole('button', { name: 'Save Organisation' }),
    ).toBeVisible();
    await expect(
      settings.main.getByText('System Status'),
    ).toBeVisible();

    // Users & Roles: invite control + member table.
    await settings.selectSection('Users & Roles');
    await expect(
      settings.main.getByRole('button', { name: 'Invite User' }),
    ).toBeVisible();
    await expect(settings.main.getByRole('table')).toBeVisible();

    // Invite modal exposes labelled fields — do not send a real invitation.
    await settings.main.getByRole('button', { name: 'Invite User' }).click();
    await expect(page.getByLabel('Email *')).toBeVisible();
    await expect(page.getByLabel('Organisation Role *')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Pricing: rule management control.
    await settings.selectSection('Pricing');
    await expect(
      settings.main.getByRole('button', { name: 'Add Pricing Rule' }),
    ).toBeVisible();
  });

  test('office cannot manage memberships, organisation or pricing', async ({
    page,
  }) => {
    requireSupabase();
    await loginAs(page, 'office');
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.main.getByLabel('Organisation Name')).toBeDisabled();
    await expect(
      settings.main.getByRole('button', { name: 'Save Organisation' }),
    ).toHaveCount(0);

    await settings.selectSection('Users & Roles');
    await expect(
      settings.main.getByRole('button', { name: 'Invite User' }),
    ).toHaveCount(0);

    await settings.selectSection('Pricing');
    await expect(
      settings.main.getByRole('button', { name: 'Add Pricing Rule' }),
    ).toHaveCount(0);
  });

  test('viewer cannot mutate organisation settings', async ({ page }) => {
    requireSupabase();
    await loginAs(page, 'viewer');
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.main.getByLabel('Organisation Name')).toBeDisabled();
    await expect(
      settings.main.getByRole('button', { name: 'Save Organisation' }),
    ).toHaveCount(0);
    await settings.selectSection('Users & Roles');
    await expect(
      settings.main.getByRole('button', { name: 'Invite User' }),
    ).toHaveCount(0);
  });

  test('field user lands on driver home and has no admin controls', async ({
    page,
  }) => {
    requireSupabase();
    await loginAs(page, 'fieldUser');
    await expect(page).toHaveURL(/\/driver/);

    // Even if they reach Settings directly, no management controls render.
    const settings = new SettingsPage(page);
    await settings.goto();
    await expect(
      settings.main.getByRole('button', { name: 'Save Organisation' }),
    ).toHaveCount(0);
    await settings.selectSection('Users & Roles');
    await expect(
      settings.main.getByRole('button', { name: 'Invite User' }),
    ).toHaveCount(0);
    await expectNoAppError(page);
  });

  test('manager can view but not manage the organisation', async ({ page }) => {
    requireSupabase();
    await loginAs(page, 'manager');
    const settings = new SettingsPage(page);
    await settings.goto();

    // canManageOrganisation = owner/admin only.
    await expect(settings.main.getByLabel('Organisation Name')).toBeDisabled();
    await expect(
      settings.main.getByRole('button', { name: 'Save Organisation' }),
    ).toHaveCount(0);
    await settings.selectSection('Users & Roles');
    await expect(
      settings.main.getByRole('button', { name: 'Invite User' }),
    ).toHaveCount(0);
  });
});
