import { expect, test } from "@playwright/test";
import { FR, addCard, dockBadge, dockGoto, gotoClean, watchErrors } from "./helpers";

const DA = (value: string) => new RegExp(value.replace(/ /g, "\\s") + "\\sDA");

test.describe("cart as a sliding bottom sheet", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page, FR);
    await addCard(page, 0);
    await addCard(page, 2);
    await addCard(page, 2);
  });

  test("the dock opens the cart over the shop with the reference line cards", async ({
    page,
  }) => {
    await dockGoto(page, /Panier/);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/fr\/cart$/);

    await expect(dialog.getByTestId("cart-line")).toHaveCount(2);

    const line = dialog.getByTestId("cart-line").first();
    await expect(line.getByText("Caméra de recul HD avec guide de stationnement")).toBeVisible();
    await expect(line.getByText("×1")).toBeVisible();
    // Unit price and line total are both 8 900 DA at quantity one.
    await expect(line.getByText(DA("8 900"))).toHaveCount(2);
  });

  test("the sheet blurs and locks the page behind it", async ({ page }) => {
    await dockGoto(page, /Panier/);
    const scrim = page.getByTestId("sheet-scrim");
    expect(await scrim.evaluate((n) => getComputedStyle(n).backdropFilter)).toContain("blur");
    expect(await page.evaluate(() => document.documentElement.className)).toContain(
      "sheet-open",
    );
  });

  test("quantity and removal update the totals", async ({ page }) => {
    await dockGoto(page, /Panier/);
    const dialog = page.getByRole("dialog");
    const second = dialog.getByTestId("cart-line").nth(1);

    await second.getByRole("button", { name: "Augmenter la quantité" }).click();
    await expect(second.getByText("×3")).toBeVisible();

    // Rail order: index 2 is the 4 500 DA organiser, so 8 900 + 3 × 4 500.
    await expect(dialog.getByText(DA("22 400")).first()).toBeVisible();

    await second.getByRole("button", { name: /Retirer/ }).click();
    await expect(dialog.getByTestId("cart-line")).toHaveCount(1);
    await expect(dialog.getByText("Offerte", { exact: true })).toBeVisible();
  });

  test("an empty cart shows the composed empty state, not a blank sheet", async ({ page }) => {
    await dockGoto(page, /Panier/);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /Retirer/ }).nth(1).click();
    await dialog.getByRole("button", { name: /Retirer/ }).first().click();
    await expect(page.getByText("Votre panier est vide")).toBeVisible();
    await expect(page.getByRole("link", { name: "Parcourir le catalogue" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Passer à la caisse/ })).toHaveCount(0);
  });

  test("the cart footer carries the total and opens checkout in the same sheet", async ({
    page,
  }) => {
    await dockGoto(page, /Panier/);
    const cta = page.getByRole("button", { name: /Passer à la caisse/ });
    await expect(cta).toContainText(DA("17 900"));
    await cta.click();
    await expect(page).toHaveURL(/\/fr\/checkout$/);
    await expect(page.getByTestId("sheet-panel")).toHaveCount(1);
    await expect(page.getByRole("dialog").getByLabel("Nom complet")).toBeVisible();
  });

  test("closing the sheet returns to the shop", async ({ page }) => {
    await dockGoto(page, /Panier/);
    await page.getByTestId("sheet-panel").getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
    await expect(page.getByTestId("product-card").first()).toBeVisible();
  });

  test("the first ever add blurs the page and spotlights the cart icon", async ({ page }) => {
    // beforeEach already added once, so start from a pristine slate here.
    await gotoClean(page, FR);
    await addCard(page, 0);
    await expect(page.getByTestId("cart-spotlight")).toBeVisible();
    await expect(page.getByText("Votre panier vous attend")).toBeVisible();
    await expect(page.getByTestId("cart-spotlight")).toHaveCount(0, { timeout: 5_000 });

    await addCard(page, 1);
    await expect(page.getByTestId("cart-spotlight")).toHaveCount(0);
  });
});

test.describe("cash-on-delivery checkout inside the sheet", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page, FR);
    await addCard(page, 0);
    await dockGoto(page, /Panier/);
    await page.getByRole("button", { name: /Passer à la caisse/ }).click();
    await expect(page).toHaveURL(/\/fr\/checkout$/);
  });

  test("the step shows the order summary, three fields and the COD tag", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    // Name-based: the exiting cart step keeps its own header h2 during the slide.
    await expect(
      dialog.getByRole("heading", { name: "Finaliser la commande", level: 2 }),
    ).toBeVisible();
    await expect(dialog.getByLabel("Nom complet")).toBeVisible();
    await expect(dialog.getByLabel("Numéro de téléphone")).toBeVisible();
    await expect(dialog.getByLabel("Adresse complète")).toBeVisible();
    await expect(dialog.getByText("Paiement à la livraison uniquement")).toBeVisible();
    // Line total, order total and the confirm CTA all read 8 900 DA.
    await expect(dialog.getByText(DA("8 900"))).toHaveCount(3);
  });

  test("empty fields block the order and explain why", async ({ page }) => {
    await page.getByRole("button", { name: /Confirmer la commande/ }).click();
    await expect(page.getByRole("alert")).not.toHaveCount(0);
    await expect(page.getByLabel("Nom complet")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/fr\/checkout$/);
  });

  test("the phone field formats as it is typed", async ({ page }) => {
    const phone = page.getByLabel("Numéro de téléphone");
    await phone.type("0560123456");
    await expect(phone).toHaveValue("05 60 12 34 56");
  });

  test("a short address is rejected inline", async ({ page }) => {
    await page.getByLabel("Nom complet").fill("Imane Bennani");
    await page.getByLabel("Numéro de téléphone").fill("0560123456");
    await page.getByLabel("Adresse complète").fill("Alger");
    await page.getByRole("button", { name: /Confirmer la commande/ }).click();
    await expect(page.getByText("Trop court.")).toBeVisible();
  });

  test("confirming produces an order confirmation in the same sheet", async ({ page }) => {
    const watcher = watchErrors(page);
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Nom complet").fill("Imane Bennani");
    await dialog.getByLabel("Numéro de téléphone").type("0560123456");
    await dialog.getByLabel("Adresse complète").fill("Alger, Bab Ezzouar, cité 500 logts, bât. C");
    await dialog.getByRole("button", { name: /Confirmer la commande/ }).click();

    await expect(page).toHaveURL(/\/fr\/order\/HT-\d{6}-\d{3}$/, { timeout: 15_000 });
    await expect(page.getByTestId("sheet-panel")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 3, name: "Commande confirmée" })).toBeVisible();
    await expect(page.getByText(/À régler à la livraison/)).toBeVisible();
    await expect(page.getByText("Alger, Bab Ezzouar, cité 500 logts, bât. C")).toBeVisible();
    await expect(dockBadge(page, "cart-badge")).toHaveCount(0);
    watcher.expectClean();
  });

  test("checkout with an empty cart falls back to the empty state", async ({ page }) => {
    await gotoClean(page, `${FR}/checkout`);
    await page.waitForSelector("html[data-hydrated]");
    await expect(page.getByText("Panier vide")).toBeVisible();
    await expect(page.getByRole("link", { name: "Parcourir le catalogue" })).toBeVisible();
  });

  test("the order is reachable from the account afterwards", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nom complet").fill("Imane Bennani");
    await dialog.getByLabel("Numéro de téléphone").fill("0560123456");
    await dialog.getByLabel("Adresse complète").fill("Alger, Bab Ezzouar, cité 500 logts");
    await dialog.getByRole("button", { name: /Confirmer la commande/ }).click();
    await expect(page).toHaveURL(/\/fr\/order\//, { timeout: 15_000 });

    await dialog.getByRole("link", { name: "Suivre ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/login\?next=\/profile$/);
  });
});
