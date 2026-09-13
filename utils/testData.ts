import { test } from '@playwright/test';

/**
 * Deterministic fictional test-data helpers.
 *
 * Every record created by the suite carries the "E2E" prefix plus a unique
 * suffix (timestamp + worker index) so parallel runs never collide and
 * leftovers are trivially identifiable for cleanup.
 */

/** Unique human-readable reference, e.g. "E2E-CUST-M4K2XQ-2". */
export function uniqueRef(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const worker = test.info().workerIndex;
  return `E2E-${prefix}-${ts}-${worker}`;
}

/** A guaranteed-nonexistent email — safe for negative-path auth tests. */
export const NONEXISTENT_EMAIL = 'e2e-nobody@example.invalid';
