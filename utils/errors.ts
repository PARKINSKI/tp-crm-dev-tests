import { expect, Page } from '@playwright/test';

/**
 * Asserts no obvious application failure is on screen: no Vite dev-server
 * error overlay and no generic crash/error-boundary text.
 */
export async function expectNoAppError(page: Page): Promise<void> {
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await expect(
    page.getByText(/something went wrong|application error/i),
  ).toHaveCount(0);
}
