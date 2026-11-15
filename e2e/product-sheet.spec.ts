import { expect, test } from "@playwright/test";
import { FR, centerInViewport, dockBadge, gotoClean, openSheetByCard, scrollAttempt, scrollToY, sheetGeometry, watchErrors } from "./helpers";

test.describe("product detail as a sliding sheet", () => {
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
    await expect(page.getByRole("heading", { level: 2, name: "Accessoires auto & gadgets" }))
      .toBeAttached();
    watcher.expectClean();
  });

  test("the sheet covers more than 70% of the viewport", async ({ page }) => {
    await openSheetByCard(page, 0);
    const { coverage } = await sheetGeometry(page);
    expect(coverage).toBeGreaterThan(0.7);
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
    await scrollToY(page, 700);
    await openSheetByCard(page, 1);

    await page.getByTestId("sheet-scrim").click({ position: { x: 200, y: 20 } });
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
    await expect(page).toHaveURL(/\/fr$/);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 3_000 })
      .toBeGreaterThan(600);
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

  test("the sheet carries the add-to-cart CTA and it writes the line", async ({ page }) => {
    await openSheetByCard(page, 2);

    const dialog = page.getByRole("dialog");
    const cta = dialog.getByTestId("buy-bar").getByRole("button", { name: "Ajouter au panier" });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();

    await dialog.getByRole("radio", { name: "Gris graphite" }).click();
    await cta.click();
    await expect(page.getByTestId("toast").last()).toBeVisible();
    await expect(dockBadge(page, "cart-badge")).toHaveText("1");
  });

  test("quantity multiplies the line total in the sheet CTA bar", async ({ page }) => {
    await openSheetByCard(page, 0);
    const dialog = page.getByRole("dialog");

    const total = dialog.getByText("Total", { exact: true }).locator("xpath=following-sibling::*");
    await expect(total).toContainText("89,00");

    await dialog.getByTestId("buy-bar").getByRole("button", { name: "Augmenter la quantité" }).click();
    await dialog.getByTestId("buy-bar").getByRole("button", { name: "Augmenter la quantité" }).click();
    await expect(total).toContainText("267,00");
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

  test("an out-of-stock product keeps a disabled CTA", async ({ page }) => {
    await page.goto(`${FR}/products`);
    const soldOut = page.getByTestId("product-card").filter({ hasText: "Kit ampoules LED H7" });
    await centerInViewport(soldOut);
    await soldOut.getByRole("link").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Rupture de stock")).toBeVisible();
    await expect(dialog.getByTestId("buy-bar").getByRole("button", { name: "Indisponible" })).toBeDisabled();
  });

  test("related products swap the sheet content without leaving the sheet", async ({
    page,
  }) => {
    await openSheetByCard(page, 0);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("link", { name: /Dash cam rétroviseur/ }).click();
    await expect(page).toHaveURL(/\/fr\/product\/p2$/);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Vistar").first()).toBeVisible();
  });

  test("a direct visit renders the full standalone page instead of a sheet", async ({
    page,
  }) => {
    const watcher = watchErrors(page);
    await page.goto(`${FR}/product/p9`);
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Démarreur d'urgence 12 V 3000 A",
    );
    await expect(page.getByRole("navigation", { name: "Fil d'Ariane" })).toBeVisible();
    await expect(page.getByTestId("buy-bar").getByRole("button", { name: "Ajouter au panier" })).toBeVisible();
    watcher.expectClean();
  });

  test("the standalone page adds to the cart too", async ({ page }) => {
    await gotoClean(page, `${FR}/product/p4`);
    await page.getByTestId("buy-bar").getByRole("button", { name: "Ajouter au panier" }).click();
    await expect(dockBadge(page, "cart-badge")).toHaveText("1");
  });
});
