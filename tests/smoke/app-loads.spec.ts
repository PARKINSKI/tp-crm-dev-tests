import { env } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { expectNoAppError } from '../../utils/errors';

test.describe('application loads', () => {
  test('opens with the app shell, dashboard and branding', async ({
    appShell,
    page,
    preset,
  }) => {
    test.info().annotations.push({
      type: 'client-preset',
      description: env.clientPreset,
    });

    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await appShell.goto('/');

    await expect(appShell.sidebar).toBeVisible();

    await appShell.expectPageHeading('Dashboard');

    await expect(appShell.logo).toBeVisible();
    await expect(appShell.productName).toBeVisible();
    await expect(appShell.productName).toContainText(/\S/);
    await expect(appShell.organisationName).toContainText(/\S/);
    await expect(appShell.productName).toHaveText(preset.productName);

    // No framework error overlay or crash screen
    await expectNoAppError(page);
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`)
      .toHaveLength(0);
  });
});
