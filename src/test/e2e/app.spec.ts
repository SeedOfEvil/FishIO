import { test, expect } from "@playwright/test";

test("app loads and aquarium scene is visible", async ({ page }) => {
	await page.goto("/");

	// Check page title
	await expect(page).toHaveTitle("FishIO");

	// Check tank scene is rendered
	const tankScene = page.locator('[data-testid="tank-scene"]');
	await expect(tankScene).toBeVisible();

	// Check HUD is present
	const hud = page.locator(".top-hud");
	await expect(hud).toBeVisible();

	// Check fish inspector placeholder is present
	const inspector = page.locator(".fish-inspector");
	await expect(inspector).toBeVisible();
});
