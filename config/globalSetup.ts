// Side-effect import first — loads .env.local/.env before env.ts reads them.
import './envLoader';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from '@playwright/test';
import { authStatePath } from './authState';
import { printEnvDiagnostics } from './diagnostics';
import { env, isSupabase, type RoleKey } from './env';

const ROLES: RoleKey[] = [
  'owner',
  'admin',
  'manager',
  'office',
  'fieldUser',
  'viewer',
];

/**
 * Playwright global setup — runs once in the runner process.
 *
 * 1. Prints the resolved non-secret configuration.
 * 2. In supabase mode, signs in ONCE per configured role and stores the
 *    session as Playwright storage state. Tests restore it instead of
 *    driving the login form — per-test UI logins trip Supabase's auth
 *    rate limiter ("Too many attempts") under parallel workers.
 */
export default async function globalSetup(): Promise<void> {
  printEnvDiagnostics();
  if (!isSupabase) return;

  const browser = await chromium.launch();
  try {
    for (const role of ROLES) {
      const creds = env.credentials[role];
      const file = authStatePath(role);

      if (!creds?.email || !creds?.password) {
        // Drop a stale capture so tests fail fast on credentials, not on
        // an outdated session file.
        if (existsSync(file)) unlinkSync(file);
        continue;
      }

      const context = await browser.newContext({ baseURL: env.baseUrl });
      const page = await context.newPage();
      try {
        await page.goto('/login');
        await page.getByLabel('Email').fill(creds.email);
        await page.getByLabel('Password').fill(creds.password);
        await page
          .getByRole('button', { name: 'Sign in', exact: true })
          .click();
        await page.waitForURL(role === 'fieldUser' ? /\/driver/ : /\/$/, {
          timeout: 30_000,
        });
      } catch (e) {
        throw new Error(
          `global setup: sign-in failed for role "${role}" (${creds.email}) — ` +
            (e instanceof Error ? e.message : String(e)),
        );
      }
      mkdirSync(dirname(file), { recursive: true });
      await context.storageState({ path: file });
      await context.close();
      console.log(`[env] auth state captured for ${role}`);
    }
  } finally {
    await browser.close();
  }
}
