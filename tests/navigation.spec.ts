import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test('should load home page successfully', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check that the page loads successfully
    expect(response?.status()).toBe(200);
    
    // Check that we're on the correct page
    await expect(page).toHaveURL('/');
  });

  test('should handle non-existent routes gracefully', async ({ page }) => {
    // This will test Next.js 404 handling when we implement proper error pages
    const response = await page.goto('/non-existent-page');
    
    // Next.js should return a 404 page
    expect(response?.status()).toBe(404);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check that viewport meta tag exists (for mobile responsiveness)
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });
});