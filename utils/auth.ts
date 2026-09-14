import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { test, type BrowserContext, type Page } from '@playwright/test';
import { authStatePath } from '../config/authState';
import { env, isMock, isSupabase, type RoleKey } from '../config/env';

/**
 * Authentication helpers.
 *
 * Mock mode: the app never requires auth — every helper is a no-op and the
 * suite runs unauthenticated. Supabase mode: global setup signs in once per
 * role and stores the session (playwright/.auth/<role>.json); `loginAs`
 * restores that session into the test's fresh context. Per-test form logins
 * trip Supabase's auth rate limiter under parallel workers, so only tests
 * that exercise the sign-in flow itself use `signInThroughUi`.
 */

interface StoredLocalStorageItem {
  name: string;
  value: string;
}

interface StoredOrigin {
  origin: string;
  localStorage: StoredLocalStorageItem[];
}

interface StoredAuthState {
  cookies?: Parameters<BrowserContext['addCookies']>[0];
  origins?: StoredOrigin[];
}

export function hasCredentials(role: RoleKey): boolean {
  const c = env.credentials[role];
  return !!c?.email && !!c?.password;
}

/**
 * In mock mode: skips the test (no authentication exists).
 * In supabase mode: fails fast when the role's credentials are missing —
 * a Supabase run without E2E_* variables must surface a clear configuration
 * error, never silently degrade into mock-style unauthenticated behaviour.
 */
export function requireCredentials(role: RoleKey): void {
  test.skip(
    !isSupabase,
    'app under test is in mock mode — no authentication required or possible',
  );
  if (!hasCredentials(role)) {
    const prefix = role === 'fieldUser' ? 'FIELD' : role.toUpperCase();
    throw new Error(
      `Missing credentials for role "${role}": set E2E_${prefix}_EMAIL and ` +
        `E2E_${prefix}_PASSWORD in .env.local (gitignored) or the environment.`,
    );
  }
}

/** Skips the current test when the app under test is in mock mode. */
export function requireSupabase(): void {
  test.skip(!isSupabase, 'requires the app under test to run in supabase mode');
}

/**
 * Restores the role's stored session (captured once in global setup) into
 * the test context, then lands on the role's home surface. No-op in mock
 * mode. Must be called before the page's first navigation — storage state
 * is seeded via addInitScript, which does not apply retroactively.
 */
export async function loginAs(page: Page, role: RoleKey = 'owner'): Promise<void> {
  if (isMock) return;
  requireCredentials(role);

  const file = authStatePath(role);
  if (!existsSync(file)) {
    throw new Error(
      `No stored auth state for role "${role}" (${file}) — global setup ` +
        'captures one session per configured role; check the run startup output.',
    );
  }
  const state = JSON.parse(await readFile(file, 'utf8')) as StoredAuthState;

  const context = page.context();
  if (state.cookies?.length) await context.addCookies(state.cookies);
  for (const origin of state.origins ?? []) {
    if (!origin.localStorage?.length) continue;
    await context.addInitScript(
      ([targetOrigin, items]) => {
        if (window.location.origin !== targetOrigin) return;
        for (const { name, value } of items) {
          window.localStorage.setItem(name, value);
        }
      },
      [origin.origin, origin.localStorage] as const,
    );
  }

  await page.goto(role === 'fieldUser' ? '/driver' : '/');
  await page.waitForLoadState('load');
}

/**
 * Signs in through the real UI form — for tests that exercise the sign-in
 * flow itself (landing redirects, session persistence, sign out). Using the
 * stored session here would be wrong: sign-out revokes the session, which
 * must never be the shared stored one.
 */
export async function signInThroughUi(
  page: Page,
  role: RoleKey = 'owner',
): Promise<void> {
  requireCredentials(role);
  const { email, password } = env.credentials[role];

  await page.goto('/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // Field users land on the driver workflow; everyone else on the dashboard.
  await page.waitForURL(role === 'fieldUser' ? /\/driver/ : /\/$/, {
    timeout: 15_000,
  });
}

/** Signs out via the sidebar button (supabase mode only). */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole('complementary').getByRole('button', { name: /sign out/i }).click();
  await page.waitForURL(/\/login/, { timeout: 15_000 });
}
