import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Generation Flow', () => {
  const testUser = {
    email: `testgen-${Date.now()}@example.com`,
    password: 'password123',
  };

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/register');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should create generation successfully', async ({ page }) => {
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.jpg'));

    // Wait for preview
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();

    // Select style
    await page.selectOption('select[id="style"]', 'artistic');

    // Enter prompt
    await page.fill('textarea[id="prompt"]', 'A stylish fashion model on runway');

    // Submit
    await page.click('button[type="submit"]');

    // Should show loading
    await expect(page.locator('text=Generating...')).toBeVisible();

    // Wait for completion (max 5 seconds)
    await expect(page.locator('text=Completed')).toBeVisible({ timeout: 5000 });

    // Check history
    await expect(page.locator('text=A stylish fashion model on runway')).toBeVisible();
  });

  test('should show error without image', async ({ page }) => {
    await page.fill('textarea[id="prompt"]', 'Test prompt');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/please select an image/i')).toBeVisible();
  });

  test('should show error without prompt', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.jpg'));

    await expect(page.locator('img[alt="Preview"]')).toBeVisible();

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/please enter a prompt/i')).toBeVisible();
  });

  test('should restore generation from history', async ({ page }) => {
    // Create a generation
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.jpg'));
    await page.fill('textarea[id="prompt"]', 'Original prompt');
    await page.selectOption('select[id="style"]', 'vintage');
    await page.click('button[type="submit"]');

    // Wait for completion
    await expect(page.locator('text=Completed')).toBeVisible({ timeout: 5000 });

    // Clear form
    await page.fill('textarea[id="prompt"]', '');

    // Click on history item
    await page.click('text=Original prompt');

    // Check if prompt is restored
    const promptField = page.locator('textarea[id="prompt"]');
    await expect(promptField).toHaveValue('Original prompt');

    // Check if style is restored
    const styleSelect = page.locator('select[id="style"]');
    await expect(styleSelect).toHaveValue('vintage');
  });

  test('should show character count', async ({ page }) => {
    const textarea = page.locator('textarea[id="prompt"]');
    await textarea.fill('Test');

    await expect(page.locator('text=4/500 characters')).toBeVisible();
  });

  test('should limit prompt to 500 characters', async ({ page }) => {
    const longText = 'a'.repeat(600);
    const textarea = page.locator('textarea[id="prompt"]');
    await textarea.fill(longText);

    const value = await textarea.inputValue();
    expect(value.length).toBe(500);
  });
});
