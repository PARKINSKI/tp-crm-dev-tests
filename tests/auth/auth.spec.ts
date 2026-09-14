import { isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { ForgotPasswordPage, LoginPage } from '../../pages/LoginPage';
import { requireCredentials, requireSupabase, signInThroughUi, signOut } from '../../utils/auth';
import { NONEXISTENT_EMAIL } from '../../utils/testData';

test.describe('authentication', () => {
  test(
    'sign-in page renders',
    { tag: '@smoke' },
    async ({ page }) => {
      const login = new LoginPage(page);
      await page.goto('/login');

      if (isSupabase) {
        await login.waitForReady();
        await expect(login.emailInput).toBeVisible();
        await expect(login.passwordInput).toBeVisible();
        await expect(login.forgotPasswordLink).toBeVisible();
      } else {
        // Mock mode never requires auth — /login redirects straight into the app.
        await expect(page).toHaveURL('/');
      }
    },
  );

  test('unauthenticated users are redirected from protected routes', async ({
    page,
  }) => {
    requireSupabase();
    await page.goto('/customers');
    await expect(page).toHaveURL(/\/login/);
    await expect(new LoginPage(page).signInButton).toBeVisible();
  });

  test('invalid credentials show an error', async ({ page }) => {
    requireSupabase();
    const login = new LoginPage(page);
    await login.goto();

    await login.signIn(NONEXISTENT_EMAIL, 'not-a-real-password');
    await expect(login.errorAlert).toBeVisible();
  });

  test('forgot password acknowledges the request without revealing accounts', async ({
    page,
  }) => {
    requireSupabase();
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();

    // A guaranteed-nonexistent address — the response must be identical either
    // way, and no real reset email can be triggered.
    await forgot.emailInput.fill(NONEXISTENT_EMAIL);
    await forgot.submitButton.click();
    await expect(forgot.confirmation).toContainText(/reset link/i);
  });

  test('reset password without a recovery token reports an invalid link', async ({
    page,
  }) => {
    requireSupabase();
    await page.goto('/reset-password');
    await expect(
      page.getByText(/invalid or has expired/i),
    ).toBeVisible();
  });

  test('sign in lands on the dashboard, session persists, sign out returns to login', async ({
    page,
    appShell,
  }) => {
    requireCredentials('owner');
    // Real form login — sign-out revokes the session, so this test must not
    // use the shared stored auth state.
    await signInThroughUi(page, 'owner');

    await appShell.expectPageHeading('Dashboard');

    // Session survives a full reload (persisted by supabase-js).
    await page.reload();
    await appShell.waitForReady();
    await expect(page).not.toHaveURL(/\/login/);

    await signOut(page);
    await expect(page).toHaveURL(/\/login/);

    // Session cleared — protected route redirects again.
    await page.goto('/customers');
    await expect(page).toHaveURL(/\/login/);
  });

  test('field user lands on the driver workflow', async ({ page }) => {
    requireCredentials('fieldUser');
    await signInThroughUi(page, 'fieldUser');
    await expect(page).toHaveURL(/\/driver/);
  });
});
