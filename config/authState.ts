import path from 'node:path';
import type { RoleKey } from './env';

/**
 * Per-role Playwright storage state captured once in global setup.
 * Files live under playwright/.auth/ (gitignored) — they contain session
 * tokens, never passwords.
 */
export function authStatePath(role: RoleKey): string {
  return path.join(process.cwd(), 'playwright', '.auth', `${role}.json`);
}
