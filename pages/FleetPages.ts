import { Locator, Page } from '@playwright/test';
import { ListPage } from './ListPage';

export class VehiclesPage extends ListPage {
  protected readonly path = '/vehicles';

  constructor(page: Page) {
    super(page);
  }

  /** Supabase mode only. */
  get addVehicleButton(): Locator {
    return this.main.getByRole('button', { name: /Add/ });
  }
}

export class FieldUsersPage extends ListPage {
  protected readonly path = '/field-users';

  constructor(page: Page) {
    super(page);
  }
}
