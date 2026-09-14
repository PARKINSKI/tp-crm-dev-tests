import { env, type RoleKey } from './env';
import { loadedEnvFiles } from './envLoader';

/**
 * Startup configuration diagnostic — prints the resolved NON-SECRET
 * configuration so a misconfigured run is obvious in the first log lines.
 * Credentials are only ever reported as configured/missing; values are
 * never printed.
 */

const ROLE_LABELS: [RoleKey, string][] = [
  ['owner', 'owner'],
  ['admin', 'admin'],
  ['manager', 'manager'],
  ['office', 'office'],
  ['fieldUser', 'field'],
  ['viewer', 'viewer'],
];

/** Logs the resolved non-secret config once at startup. */
export function printEnvDiagnostics(): void {
  const lines = [
    `DATA_MODE=${env.dataMode}`,
    `CLIENT_PRESET=${env.clientPreset}`,
    `BASE_URL=${env.baseUrl}`,
    `PROD_BUILD=${env.isProdBuild ? '1' : '0'}`,
    `env files: ${loadedEnvFiles.length ? loadedEnvFiles.join(', ') : '(none found)'}`,
  ];
  console.log(`[env] ${lines.join('  ')}`);

  if (env.dataMode === 'supabase') {
    const roles = ROLE_LABELS.map(([role, label]) => {
      const c = env.credentials[role];
      return `${label}:${c?.email && c?.password ? 'configured' : 'MISSING'}`;
    });
    console.log(`[env] credentials — ${roles.join('  ')}`);
  }
}
