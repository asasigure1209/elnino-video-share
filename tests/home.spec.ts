import { test, expect } from "@playwright/test";

test.describe("ホームページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/エルニーニョ動画配布サイト/);
  });

  test("should have proper page structure", async ({ page }) => {
    // Check main container
    const main = page.locator("main");
    await expect(main).toBeVisible();

    // Check main logo image
    const logo = page.getByAltText("エルニーニョ vol.10");
    await expect(logo).toBeVisible();
  });

  test("should display player list section", async ({ page }) => {
    // Check table headers
    const noHeader = page.getByText("No");
    await expect(noHeader).toBeVisible();
    
    const entryHeader = page.getByText("エントリー名");
    await expect(entryHeader).toBeVisible();

    // Check for player data
    const player1 = page.getByText("るぐら");
    await expect(player1).toBeVisible();

    const player2 = page.getByText("風龍");
    await expect(player2).toBeVisible();

    const player3 = page.getByText("せせらぎ");
    await expect(player3).toBeVisible();

    // Check for video buttons
    const videoButtons = page.getByText("動画");
    await expect(videoButtons.first()).toBeVisible();
  });
});
