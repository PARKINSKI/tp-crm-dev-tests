import { expect, test } from '../../fixtures/base';
import { DispatchPage } from '../../pages/DispatchPage';
import { expectNoAppError } from '../../utils/errors';

test.describe('dispatch', () => {
  test('route planner loads with panels, stops and map', async ({
    appShell,
    page,
    preset,
  }) => {
    test.skip(
      !preset.navItems.some((item) => item.key === 'dispatch'),
      'dispatch module disabled for this preset',
    );

    const dispatch = new DispatchPage(page);
    await dispatch.goto();

    await appShell.expectPageHeading('Dispatch');
    await expectNoAppError(page);

    for (const panel of ['Unplanned Jobs', 'Route Summary', 'Stops']) {
      await expect(dispatch.panel(panel), `panel "${panel}"`).toBeVisible();
    }

    await expect(dispatch.map).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create Route' }),
    ).toBeVisible();
  });
});
