export interface EnvConfig {
  /** Base URL of the tp-crm application under test. */
  baseUrl: string;
  /**
   * Client preset the tests expect the application to be running with.
   * This only describes the expected state to the test framework — the app
   * itself must be launched with its own VITE_CLIENT_PRESET variable.
   */
  clientPreset: string;
  isCI: boolean;
}

export const env: EnvConfig = {
  baseUrl: process.env.BASE_URL ?? 'http://localhost:5175',
  clientPreset: process.env.CLIENT_PRESET ?? 'demo',
  isCI: !!process.env.CI,
};
