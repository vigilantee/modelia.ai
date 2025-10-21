import { test, expect } from '@playwright/test';

test.describe('Full AI Studio Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };

  test('complete user journey: signup → login → generate → view history', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Go to signup
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/\/register/);

    // Register new account
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=AI Studio')).toBeVisible();

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-image.png');

    // Wait for preview
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();

    // Select style
    await page.selectOption('select[id="style"]', 'artistic');

    // Enter prompt
    await page.fill('textarea[id="prompt"]', 'A stylish fashion model on runway');

    // Click generate
    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.locator('text=Generating...')).toBeVisible();

    // Should show abort button
    await expect(page.locator('text=Abort')).toBeVisible();

    // Wait for generation to complete (max 5 seconds)
    await page.waitForSelector('text=Completed', { timeout: 5000 });

    // Check recent generations section
    const recentGenerations = page.locator('.card').nth(1);
    await expect(recentGenerations.locator('text=Recent Generations')).toBeVisible();

    // Should see the generation in history
    await expect(recentGenerations.locator('text=A stylish fashion model on runway')).toBeVisible();

    // Click on generation to restore
    await recentGenerations.locator('text=A stylish fashion model on runway').click();

    // Prompt should be restored in form
    const promptField = page.locator('textarea[id="prompt"]');
    await expect(promptField).toHaveValue('A stylish fashion model on runway');

    // Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL(/\/login/);

    // Login again
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should see dashboard with previous generations
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=A stylish fashion model on runway')).toBeVisible();
  });

  test('retry on error', async ({ page }) => {
    await page.goto('/login');

    // Login with existing user
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    // Create multiple generations to trigger error (20% chance)
    let errorEncountered = false;
    for (let i = 0; i < 10 && !errorEncountered; i++) {
      await page.reload();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/test-image.png');
      await page.fill('textarea[id="prompt"]', `Test prompt ${i}`);
      await page.click('button[type="submit"]');

      // Wait a bit
      await page.waitForTimeout(3000);

      // Check if error occurred
      const errorMessage = page.locator('text=/overload/i');
      if (await errorMessage.isVisible()) {
        errorEncountered = true;

        // Should show retry button
        await expect(page.locator('text=Retry')).toBeVisible();

        // Click retry
        await page.click('text=Retry');

        // Should start generating again
        await expect(page.locator('text=Generating...')).toBeVisible();
      }
    }

    if (!errorEncountered) {
      console.warn('Error not triggered in 10 attempts (expected due to 20% rate)');
    }
  });

  test('abort generation', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-image.png');
    await page.fill('textarea[id="prompt"]', 'Test abort');
    await page.click('button[type="submit"]');

    // Wait for loading state
    await expect(page.locator('text=Generating...')).toBeVisible();

    // Click abort
    await page.click('text=Abort');

    // Should show cancelled message
    await expect(page.locator('text=/cancel/i')).toBeVisible();

    // Generate button should be enabled again
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});
