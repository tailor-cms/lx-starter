import { expect, test } from '@playwright/test';
import { AppBar } from '../../../pom/common/AppBar.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { SignIn } from '../../../pom/auth/SignIn.ts';
import { TEST_USER } from '../../../fixtures/auth.ts';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  const authPage = new SignIn(page);
  await authPage.visit();
  await authPage.signIn(TEST_USER.email, TEST_USER.password);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('should be able to access admin page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.goToAdmin();
  await expect(page).toHaveTitle('Admin');
  await expect(page.getByText('User Management')).toBeVisible();
});

test('should be able to navigate to the home page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.goToAdmin();
  await expect(page.getByText('User Management')).toBeVisible();
  await appBar.goToHome();
  await expect(page.getByText('For You')).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
