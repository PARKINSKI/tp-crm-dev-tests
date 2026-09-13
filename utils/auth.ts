import { test, type Page } from '@playwright/test';
import { env, isMock, isSupabase, type RoleKey } from '../config/env';

/**
 * Authentication helpers.
 *
 * Mock mode: the app never requires auth — every helper is a no-op and the
 * suite runs unauthenticated. Supabase mode: helpers drive the real sign-in
 * form; tests self-skip when credentials for the requested role are absent.
 */

export function hasCredentials(role: RoleKey): boolean {
  const c = env.credentials[role];
  return !!c?.email && !!c?.password;
}

/** Skips the current test when the app needs auth but no creds exist. */
export function requireCredentials(role: RoleKey): void {
  test.skip(
    !isSupabase,
    'app under test is in mock mode — no authentication required or possible',
  );
  test.skip(
    !hasCredentials(role),
    `missing credentials: set E2E_${role === 'fieldUser' ? 'FIELD' : role.toUpperCase()}_EMAIL and E2E_${role === 'fieldUser' ? 'FIELD' : role.toUpperCase()}_PASSWORD`,
  );
}

/** Skips the current test when the app under test is in mock mode. */
export function requireSupabase(): void {
  test.skip(!isSupabase, 'requires the app under test to run in supabase mode');
}

/**
 * Signs in through the UI as the given role and waits for the role's landing
 * page. No-op in mock mode. Skips the test when credentials are not set.
 */
export async function loginAs(page: Page, role: RoleKey = 'owner'): Promise<void> {
  if (isMock) return;
  requireCredentials(role);
  const { email, password } = env.credentials[role];

  await page.goto('/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // Field users land on the driver workflow; everyone else on the dashboard.
  await page.waitForURL(role === 'fieldUser' ? /\/driver/ : /\/$/, { timeout: 15_000 });
}

/** Signs out via the sidebar button (supabase mode only). */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole('complementary').getByRole('button', { name: /sign out/i }).click();
  await page.waitForURL(/\/login/, { timeout: 15_000 });
}
