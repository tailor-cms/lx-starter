import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { OidcSignIn } from './OidcSignIn';
import { Onboarding } from '../onboarding';

export class SignIn {
  static route = '/auth';
  readonly page: Page;
  readonly oidcBtn: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.oidcBtn = page.getByTestId('auth_oidcLoginBtn');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.forgotPasswordLink = page.getByRole('link', {
      name: 'Forgot password?',
    });
    this.submitBtn = page.getByRole('button', { name: 'Sign in', exact: true });
  }

  visit() {
    return this.page.goto(SignIn.route);
  }

  fillEmail(email: string) {
    return this.emailInput.fill(email);
  }

  fillPassword(password: string) {
    return this.passwordInput.fill(password);
  }

  /**
   * Sign in with email and password, completing onboarding if needed.
   */
  async signIn(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitBtn.click();

    // Wait for final destination - title only updates after page fully renders
    // (including any middleware redirects like / → /onboarding)
    await expect(this.page).toHaveTitle(/Home|Onboarding/, { timeout: 15000 });

    // Skip onboarding if user was redirected there
    const onboarding = new Onboarding(this.page);
    await onboarding.handleIfPresent();
  }

  async oidcSignIn(email?: string, password?: string) {
    await this.oidcBtn.click();
    const oidcSignInPage = new OidcSignIn(this.page);
    await oidcSignInPage.signIn(email, password);
  }
}
