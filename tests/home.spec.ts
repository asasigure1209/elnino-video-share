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

    // Check main heading
    const mainHeading = page.getByRole("heading", {
      name: "エルニーニョ動画配布サイト",
    });
    await expect(mainHeading).toBeVisible();
  });

  test("should display player list section", async ({ page }) => {
    // Check player list section
    const playerSection = page.getByRole("heading", { name: /プレイヤー一覧/ });
    await expect(playerSection).toBeVisible();

    // Check description
    const description = page.getByText("参加プレイヤーの一覧を表示します");
    await expect(description).toBeVisible();
  });
});
