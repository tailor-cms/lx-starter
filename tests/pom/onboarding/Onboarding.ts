import type { Locator, Page } from '@playwright/test';

export class Onboarding {
  static route = '/onboarding';

  readonly page: Page;
  readonly skipBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.skipBtn = page.getByRole('button', { name: 'Skip' });
  }

  isOnOnboardingPage(): boolean {
    return this.page.url().includes('/onboarding');
  }

  async skip(): Promise<void> {
    // Timeout allows for onboarding page's loading state to complete
    await this.skipBtn.click({ timeout: 15000 });
    await this.page.waitForURL((url) => !url.pathname.includes('/onboarding'));
  }

  async handleIfPresent(): Promise<void> {
    if (this.isOnOnboardingPage()) {
      await this.skip();
    }
  }
}
