import type { Locator, Page } from '@playwright/test';

export class AppBar {
  readonly page: Page;
  readonly el: Locator;
  readonly homeLink: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('#mainAppBar');
    this.homeLink = this.el.locator('.app-brand');
    this.userMenu = this.el.getByLabel('User menu');
  }

  async logout() {
    await this.userMenu.click();
    await this.el.getByText('Logout').click();
  }

  async goToAdmin() {
    await this.userMenu.click();
    await this.el.getByRole('link', { name: 'Admin' }).click();
  }

  async goToHome() {
    await this.homeLink.click();
  }
}
