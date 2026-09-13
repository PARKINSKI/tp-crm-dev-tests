import { expect, test } from '../../fixtures/base';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test(
    'every enabled module loads with the correct heading',
    { tag: '@smoke' },
    async ({ appShell, page, preset }) => {
      await appShell.goto('/');

      for (const item of preset.navItems) {
        await test.step(`navigate to ${item.label}`, async () => {
          await appShell.navLinkByHref(item.href).click();
          await expect(page).toHaveURL(item.href);
          await appShell.expectPageHeading(item.label);
          await expectNoAppError(page);
        });
      }
    },
  );
});
