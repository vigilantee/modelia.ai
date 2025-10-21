import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };

  test('should complete signup flow', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Click signup link
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/\/register/);

    // Fill registration form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=AI Studio')).toBeVisible();
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible();
  });

  test('should reject invalid email on signup', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=/invalid email/i')).toBeVisible();
  });

  test('should reject password mismatch', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', 'password123');
    await page.fill('input[id="confirmPassword"]', 'different');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/passwords do not match/i')).toBeVisible();
  });

  test('should login with existing user', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should reject wrong password on login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/invalid/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL(/\/login/);
  });
});
