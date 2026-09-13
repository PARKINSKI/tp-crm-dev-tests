/**
 * Environment configuration for the test run.
 *
 * The variables describe the application under test — they never change the
 * app itself. The app must be launched separately with its own
 * VITE_CLIENT_PRESET / VITE_DATA_MODE settings.
 */

export type DataMode = 'mock' | 'supabase';

/** Organisation roles the app supports (see src/auth/permissions.ts). */
export type RoleKey = 'owner' | 'admin' | 'manager' | 'office' | 'fieldUser' | 'viewer';

export interface RoleCredentials {
  email?: string;
  password?: string;
}

export interface EnvConfig {
  /** Base URL of the tp-crm application under test. */
  baseUrl: string;
  /**
   * Client preset the tests expect the application to be running with.
   * The app itself must be launched with its own VITE_CLIENT_PRESET variable.
   */
  clientPreset: string;
  /**
   * Data mode the application under test is running in
   * (its VITE_DATA_MODE). 'mock' = built-in demo dataset, no login;
   * 'supabase' = real auth + database, E2E_* credentials required.
   */
  dataMode: DataMode;
  isCI: boolean;
  /**
   * Set to '1'/'true' when the app under test is a production build
   * (`vite build` / `vite preview`, staging). Dev-only content such as the
   * 'Active Preset' badge and VITE_* instructions is hidden by the app in
   * production builds, so the developer-text regression only asserts
   * absence there — a dev server intentionally still shows it.
   */
  isProdBuild: boolean;
  /** Test user credentials per role. Never committed — set via env vars. */
  credentials: Record<RoleKey, RoleCredentials>;
}

function readDataMode(): DataMode {
  const raw = (process.env.DATA_MODE ?? 'mock').trim().toLowerCase();
  if (raw !== 'mock' && raw !== 'supabase') {
    throw new Error(`Unknown DATA_MODE "${raw}". Supported values: mock, supabase`);
  }
  return raw;
}

export const env: EnvConfig = {
  baseUrl: process.env.BASE_URL ?? 'http://localhost:5175',
  clientPreset: process.env.CLIENT_PRESET ?? 'demo',
  dataMode: readDataMode(),
  isCI: !!process.env.CI,
  isProdBuild: /^(1|true)$/i.test(process.env.PROD_BUILD ?? ''),
  credentials: {
    owner: { email: process.env.E2E_OWNER_EMAIL, password: process.env.E2E_OWNER_PASSWORD },
    admin: { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD },
    manager: {
      email: process.env.E2E_MANAGER_EMAIL,
      password: process.env.E2E_MANAGER_PASSWORD,
    },
    office: { email: process.env.E2E_OFFICE_EMAIL, password: process.env.E2E_OFFICE_PASSWORD },
    fieldUser: {
      email: process.env.E2E_FIELD_EMAIL,
      password: process.env.E2E_FIELD_PASSWORD,
    },
    viewer: { email: process.env.E2E_VIEWER_EMAIL, password: process.env.E2E_VIEWER_PASSWORD },
  },
};

export const isSupabase = env.dataMode === 'supabase';
export const isMock = env.dataMode === 'mock';
