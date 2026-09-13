import { expect, test } from '../../fixtures/base';
import { FieldUsersPage, VehiclesPage } from '../../pages/FleetPages';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('vehicles and field users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test('vehicles list renders', async ({ appShell, page, preset }) => {
    test.skip(
      !preset.navItems.some((i) => i.key === 'vehicles'),
      'vehicles module hidden for this preset',
    );
    const vehicles = new VehiclesPage(page);
    await vehicles.goto();
    await appShell.expectPageHeading(/vehicles/i);
    await expectNoAppError(page);
    await vehicles.expectRows();
    await expect(
      page.getByRole('columnheader', { name: 'Registration' }),
    ).toBeVisible();
  });

  test('field users list renders', async ({ appShell, page, preset }) => {
    test.skip(
      !preset.navItems.some((i) => i.key === 'fieldUsers'),
      'field users module hidden for this preset',
    );
    const users = new FieldUsersPage(page);
    await users.goto();
    await appShell.expectPageHeading(new RegExp(preset.terms.fieldUser.plural, 'i'));
    await expectNoAppError(page);
    await users.expectRows();
    await expect(
      page.getByRole('columnheader', { name: 'Name' }),
    ).toBeVisible();
  });
});
