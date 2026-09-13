import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /login, /forgot-password and /reset-password — public auth screens, only
 * interactive in supabase mode (mock mode redirects /login to the dashboard).
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get emailInput(): Locator {
    return this.page.getByLabel('Email');
  }

  get passwordInput(): Locator {
    return this.page.getByLabel('Password');
  }

  get signInButton(): Locator {
    return this.page.getByRole('button', { name: 'Sign in', exact: true });
  }

  /** Error container — rendered with role="alert". */
  get errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  get forgotPasswordLink(): Locator {
    return this.page.getByRole('link', { name: 'Forgot password?' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.signInButton).toBeVisible();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}

export class ForgotPasswordPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get emailInput(): Locator {
    return this.page.getByLabel('Email');
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Send reset link' });
  }

  /** Success notice — role="status". */
  get confirmation(): Locator {
    return this.page.getByRole('status');
  }

  async goto(): Promise<void> {
    await this.page.goto('/forgot-password');
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.submitButton).toBeVisible();
  }
}
