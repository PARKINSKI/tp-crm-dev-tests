import { isSupabase } from '../../config/env';
import { expect, test } from '../../fixtures/base';
import { DispatchPage } from '../../pages/DispatchPage';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('dispatch', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('route planner loads with unrouted jobs, stops and map', async ({
    page,
    preset,
  }) => {
    test.skip(
      !preset.navItems.some((item) => item.key === 'dispatch'),
      'dispatch module disabled for this preset',
    );

    const dispatch = new DispatchPage(page);
    await dispatch.goto();

    await expectNoAppError(page);

    await expect(dispatch.panel('Unrouted Jobs')).toBeVisible();
    await expect(dispatch.panel('Stops')).toBeVisible();

    // MapLibre canvas — structural check only.
    await expect(dispatch.map).toBeVisible();

    if (isSupabase) {
      await expect(dispatch.createRouteButton).toBeVisible();
    }
  });
});
