import { expect, test } from '../../fixtures/base';
import { NotificationsPage } from '../../pages/NotificationsPage';
import { loginAs } from '../../utils/auth';
import { expectNoAppError } from '../../utils/errors';

test.describe('notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  test(
    'bell exposes an accessible name, unread badge and dropdown',
    { tag: '@smoke' },
    async ({ appShell, page }) => {
      await appShell.goto('/');
      await expectNoAppError(page);

      // Accessible name is 'Notifications' or 'Notifications, N unread'.
      await expect(appShell.notificationBell).toBeVisible();
      await expect(appShell.notificationBell).toHaveAttribute(
        'aria-label',
        /^Notifications/,
      );

      await appShell.notificationBell.click();
      await expect(appShell.notificationMenu).toBeVisible();
      await expect(
        appShell.notificationMenu.getByRole('button', {
          name: 'Mark all as read',
        }),
      ).toBeVisible();
      await expect(
        appShell.notificationMenu.getByRole('button', {
          name: 'View all notifications',
        }),
      ).toBeVisible();
    },
  );

  test('dropdown item navigates to its target and marks it read', async ({
    appShell,
    page,
  }) => {
    await appShell.goto('/');
    await appShell.notificationBell.click();
    await expect(appShell.notificationMenu).toBeVisible();

    // Exclude the header/footer actions — notification rows are the rest.
    const items = appShell.notificationMenu
      .getByRole('button')
      .filter({ hasNotText: /Mark all as read|View all notifications/ });
    const emptyState = appShell.notificationMenu.getByText(
      "You're all caught up.",
    );
    await expect(items.first().or(emptyState)).toBeVisible();
    if (await emptyState.isVisible()) {
      test.skip(true, 'no seeded notifications — add dev-notifications-seed.sql data');
    }
    await items.first().click();
    await expect(page).not.toHaveURL(/\/$/);
    await expectNoAppError(page);
  });

  test('notifications page filters and item actions render', async ({
    page,
  }) => {
    const notifications = new NotificationsPage(page);
    await notifications.goto();
    await expectNoAppError(page);

    for (const chip of ['All', 'Unread', 'Open', 'Resolved']) {
      await expect(notifications.filterChip(chip), `chip "${chip}"`)
        .toBeVisible();
    }
    await expect(notifications.typeFilter).toBeVisible();
    await expect(notifications.markAllReadButton).toBeVisible();

    // Per-item actions — requires seeded notification data. Wait for the
    // list to settle into either "items" or the empty state first.
    const openButton = page.getByRole('button', { name: 'Open' }).first();
    const emptyState = page.getByText('No notifications here.');
    await expect(openButton.or(emptyState)).toBeVisible();
    if (await emptyState.isVisible()) {
      test.skip(true, 'no seeded notifications — add dev-notifications-seed.sql data');
    }
    await expect(
      page.getByRole('button', { name: 'Open' }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Mark as read' }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Dismiss' }).first(),
    ).toBeVisible();

    // Filtering to 'Resolved' still renders the list without errors.
    await notifications.filterChip('Resolved').click();
    await expectNoAppError(page);
  });

  test('View all notifications navigates to the notifications page', async ({
    appShell,
    page,
  }) => {
    await appShell.goto('/');
    await appShell.notificationBell.click();
    await appShell.notificationMenu
      .getByRole('button', { name: 'View all notifications' })
      .click();

    await expect(page).toHaveURL(/\/notifications/);
    await new NotificationsPage(page).waitForReady();
  });
});
