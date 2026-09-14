// Side-effect import first — loads .env.local/.env before env.ts reads them.
import './envLoader';
import { printEnvDiagnostics } from './diagnostics';

/**
 * Playwright global setup — runs once in the runner process. Prints the
 * resolved non-secret configuration so a misconfigured environment is
 * visible in the first lines of every run.
 */
export default function globalSetup(): void {
  printEnvDiagnostics();
}
