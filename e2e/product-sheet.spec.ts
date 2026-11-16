import { expect, test } from "@playwright/test";
import {
  FR,
  centerInViewport,
  dockBadge,
  gotoClean,
  openSheetByCard,
  scrollAttempt,
  scrollToY,
  sheetGeometry,
  watchErrors,
} from "./helpers";

test.describe("product story as a sliding bottom sheet", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page, FR);
  });

  test("opening a card slides a sheet over the shop and changes the URL", async ({
    page,
  }) => {
    const watcher = watchErrors(page);
    await openSheetByCard(page, 0);

    await expect(page).toHaveURL(/\/fr\/product\/p1$/);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    // The shop behind stays mounted rather than being replaced.
    await expect(
      page.getByRole("heading", { level: 2, name: "Coups de cœur" }),
    ).toBeAttached();
    watcher.expectClean();
  });

  test("the sheet covers more than 70% of the viewport with a top strip", async ({
    page,
  }) => {
    await openSheetByCard(page, 0);
    const { coverage, box } = await sheetGeometry(page);
    expect(coverage).toBeGreaterThan(0.7);
    expect(box.y).toBeGreaterThan(0);
  });

  test("the background is blurred and cannot scroll", async ({ page }) => {
    await scrollToY(page, 500);
    await openSheetByCard(page, 0);

    const { scrimStyles, locked } = await sheetGeometry(page);
    expect(scrimStyles.filter).toContain("blur");
    expect(locked.htmlClass).toContain("sheet-open");
    expect(locked.overflow).toBe("hidden");

    const { before, after } = await scrollAttempt(page);
    expect(after).toBe(before);
  });

  test("clicking outside closes the sheet and restores the previous scroll", async ({
    page,
  }) => {
    await scrollToY(page, 400);
    await openSheetByCard(page, 1);

    await page.getByTestId("sheet-scrim").click({ position: { x: 200, y: 10 } });
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
    await expect(page).toHaveURL(/\/fr$/);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 3_000 })
      .toBeGreaterThan(350);
  });

  test("Escape closes the sheet", async ({ page }) => {
    await openSheetByCard(page, 0);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
  });

  test("the browser back button closes the sheet", async ({ page }) => {
    await openSheetByCard(page, 0);
    await page.goBack();
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
    await expect(page).toHaveURL(/\/fr(\?|$)/);
  });

  test("add-to-cart from the sheet slides straight to checkout in the same sheet", async ({
    page,
  }) => {
    const watcher = watchErrors(page);
    await openSheetByCard(page, 2);
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(page).toHaveURL(/\/fr\/checkout$/);
    // Same sheet, new step: the panel never unmounted.
    await expect(page.getByTestId("sheet-panel")).toHaveCount(1);
    await expect(dialog.getByLabel("Nom complet")).toBeVisible();
    await expect(dockBadge(page, "cart-badge")).toHaveText("1");
    watcher.expectClean();
  });

  test("buy-now skips the cart step and can confirm directly", async ({ page }) => {
    await openSheetByCard(page, 0);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Acheter maintenant" }).click();
    await expect(page).toHaveURL(/\/fr\/checkout$/);

    await dialog.getByLabel("Nom complet").fill("Imane Bennani");
    await dialog.getByLabel("Numéro de téléphone").fill("0560123456");
    await dialog.getByLabel("Adresse complète").fill("Alger, Bab Ezzouar, cité 500 logts");
    await dialog.getByRole("button", { name: /Confirmer la commande/ }).click();
    await expect(page).toHaveURL(/\/fr\/order\/HT-\d{6}-\d{3}$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 3, name: "Commande confirmée" })).toBeVisible();
  });

  test("back from checkout returns to the product step inside the same sheet", async ({
    page,
  }) => {
    await openSheetByCard(page, 0);
    await page.getByRole("dialog").getByRole("button", { name: "Acheter maintenant" }).click();
    await expect(page).toHaveURL(/\/fr\/checkout$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/fr\/product\/p1$/);
    await expect(page.getByTestId("sheet-panel")).toHaveCount(1);
    await expect(page.getByRole("dialog").getByRole("button", { name: "Acheter maintenant" })).toBeVisible();
  });

  test("focus is trapped inside the sheet and returns to the card", async ({ page }) => {
    await openSheetByCard(page, 0);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 12; i += 1) await page.keyboard.press("Tab");
    await expect
      .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
      .toBe(true);

    await page.keyboard.press("Escape");
    await expect
      .poll(() =>
        page.evaluate(() => document.activeElement?.getAttribute("href") ?? ""),
      )
      .toContain("/fr/product/p1");
  });

  test("an out-of-stock product keeps disabled CTAs", async ({ page }) => {
    await page.goto(`${FR}/products`);
    const soldOut = page.getByTestId("product-card").filter({ hasText: "Kit ampoules LED H7" });
    await centerInViewport(soldOut);
    await soldOut.getByRole("link").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Media overlay and the stock chip both carry the label.
    await expect(dialog.getByText("Rupture de stock").first()).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Ajouter", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Acheter maintenant" })).toBeDisabled();
  });

  test("a direct visit opens the same sheet, not a standalone page", async ({ page }) => {
    const watcher = watchErrors(page);
    await page.goto(`${FR}/product/p9`);
    await page.waitForSelector("html[data-hydrated]");
    await expect(page.getByTestId("sheet-panel")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("heading", { level: 2 })).toHaveText(
      "Démarreur d'urgence 12 V 3000 A",
    );
    watcher.expectClean();
  });

  test("the sheet shows DZD prices, description and specs", async ({ page }) => {
    await openSheetByCard(page, 0);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/8\s900\sDA/)).toBeVisible();
    await expect(dialog.getByText(/11\s900\sDA/)).toBeVisible();
    await expect(dialog.getByText("Repères de stationnement réglables en hauteur")).toBeVisible();
    await expect(dialog.getByText("Définition")).toBeVisible();
  });
});
