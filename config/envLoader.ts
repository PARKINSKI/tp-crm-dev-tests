import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Loads local environment files BEFORE config/env.ts reads process.env.
 *
 * Import this module for its side effect, and always import it before any
 * module that reads process.env (e.g. at the top of playwright.config.ts).
 *
 * Precedence: process.env > .env.local > .env. dotenv never overrides
 * variables that are already set, so .env.local is loaded first and wins
 * over .env, and real shell/CI variables win over both files.
 *
 * Both files are gitignored — credentials live there, never in the repo.
 * .env.example is documentation only and is intentionally NOT loaded.
 */
const cwd = process.cwd();

export const loadedEnvFiles: string[] = [];

for (const file of ['.env.local', '.env']) {
  const result = dotenv.config({ path: path.join(cwd, file), quiet: true });
  if (result.parsed) loadedEnvFiles.push(file);
}
