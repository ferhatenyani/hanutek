import { expect, test } from "@playwright/test";
import { FR, addCard, dockBadge, dockGoto, gotoClean, watchErrors } from "./helpers";

test.describe("cart as a sliding sheet", () => {
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
    // Unit price and line total are both 89,00 € at quantity one.
    await expect(line.getByText("89,00 €")).toHaveCount(2);
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

    const total = dialog.getByText("Total", { exact: true }).locator("xpath=following-sibling::*");
    await expect(total).toContainText("164,00");

    await second.getByRole("button", { name: /Retirer/ }).click();
    await expect(dialog.getByTestId("cart-line")).toHaveCount(1);
    await expect(dialog.getByText("Livraison standard offerte", { exact: false })).toBeVisible();
  });

  test("an empty cart shows the composed empty state, not a blank sheet", async ({ page }) => {
    await dockGoto(page, /Panier/);
    await page.getByRole("button", { name: "Vider le panier" }).click();
    await expect(page.getByText("Votre panier est vide")).toBeVisible();
    await expect(page.getByRole("link", { name: "Parcourir le catalogue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Passer la commande" })).toHaveCount(0);
  });

  test("a promo code changes the total and can be removed", async ({ page }) => {
    await dockGoto(page, /Panier/);
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("textbox", { name: "Code promo" }).fill("HANU10");
    await dialog.getByRole("button", { name: "Appliquer" }).click();
    await expect(dialog.getByText("Remise HANU10")).toBeVisible();
    await expect(dialog.getByText("-13,90 €")).toBeVisible();

    await dialog.getByRole("button", { name: "Retirer", exact: true }).click();
    await expect(dialog.getByText("Remise HANU10")).toHaveCount(0);
  });

  test("an unknown promo code is rejected inline", async ({ page }) => {
    await dockGoto(page, /Panier/);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Code promo" }).fill("NOPE");
    await dialog.getByRole("button", { name: "Appliquer" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("Ce code n'existe pas encore.");
  });

  test("closing the sheet returns to the shop", async ({ page }) => {
    await dockGoto(page, /Panier/);
    await page.getByTestId("sheet-panel").getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
    await expect(page.getByTestId("product-card").first()).toBeVisible();
  });
});

test.describe("checkout workflow", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page, FR);
    await addCard(page, 0);
    await dockGoto(page, /Panier/);
    await page.getByRole("link", { name: "Passer la commande" }).click();
    await expect(page).toHaveURL(/\/fr\/checkout$/);
  });

  test("the flow starts on the contact step with a live summary", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Finaliser la commande");
    await expect(page.getByRole("heading", { name: "Coordonnées" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Votre commande" })).toBeVisible();
    await expect(page.getByTestId("cart-line")).toHaveCount(0);
  });

  test("empty fields block the step and explain why", async ({ page }) => {
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();
    await expect(page.getByRole("alert")).not.toHaveCount(0);
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/fr\/checkout$/);
  });

  test("an invalid e-mail format is rejected", async ({ page }) => {
    await page.getByLabel("E-mail", { exact: true }).fill("not-an-email");
    await page.getByLabel("Prénom", { exact: true }).fill("Imane");
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();
    await expect(page.getByText("Le format n'est pas valide.")).toBeVisible();
  });

  test("the phone field formats as it is typed", async ({ page }) => {
    await page.getByLabel("Téléphone", { exact: true }).type("0624180733");
    await expect(page.getByLabel("Téléphone", { exact: true })).toHaveValue("06 24 18 07 33");
  });

  test("a full three-step payment produces an order confirmation", async ({ page }) => {
    const watcher = watchErrors(page);

    await page.getByLabel("E-mail", { exact: true }).fill("imane.bennani@example.fr");
    await page.getByLabel("Prénom", { exact: true }).fill("Imane");
    await page.getByLabel("Nom", { exact: true }).fill("Bennani");
    await page.getByLabel("Téléphone", { exact: true }).type("0624180733");
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();

    await expect(page.getByRole("radio", { name: /Standard/ })).toBeChecked();
    await page.getByLabel("Adresse", { exact: true }).fill("14 rue des Ateliers");
    await page.getByLabel("Code postal", { exact: true }).fill("75011");
    await page.getByLabel("Ville", { exact: true }).fill("Paris");
    await page.getByRole("button", { name: "Continuer vers le paiement" }).click();

    await page.getByLabel("Titulaire de la carte").fill("Imane Bennani");
    await page.getByLabel("Numéro de carte").type("4242424242424242");
    await expect(page.getByLabel("Numéro de carte")).toHaveValue("4242 4242 4242 4242");
    await page.getByLabel("Expiration").type("1230");
    await expect(page.getByLabel("Expiration")).toHaveValue("12/30");
    await page.getByLabel("Cryptogramme").fill("123");

    await page.getByRole("checkbox").check();
    const pay = page.getByRole("button", { name: "Payer 89,00 €" });
    await expect(pay).toBeEnabled();
    await pay.click();

    await expect(page).toHaveURL(/\/fr\/order\/HT-\d{6}-\d{3}$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Commande confirmée");
    await expect(page.getByText("Merci Imane")).toBeVisible();
    await expect(page.getByText("Livraison estimée le")).toBeVisible();
    await expect(page.getByText("Visa ·•••• 4242")).toBeVisible();
    watcher.expectClean();
  });

  test("express delivery changes the amount to pay", async ({ page }) => {
    await page.getByLabel("E-mail", { exact: true }).fill("imane@example.fr");
    await page.getByLabel("Prénom", { exact: true }).fill("Imane");
    await page.getByLabel("Nom", { exact: true }).fill("Bennani");
    await page.getByLabel("Téléphone", { exact: true }).type("0624180733");
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();
    await page.getByText("Express", { exact: true }).click();
    await expect(
      page.getByRole("complementary").or(page.locator("aside")),
    ).toContainText("98,90");
  });

  test("the pay control stays disabled until terms are accepted", async ({ page }) => {
    await page.getByLabel("E-mail", { exact: true }).fill("imane@example.fr");
    await page.getByLabel("Prénom", { exact: true }).fill("Imane");
    await page.getByLabel("Nom", { exact: true }).fill("Bennani");
    await page.getByLabel("Téléphone", { exact: true }).type("0624180733");
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();
    await page.getByLabel("Adresse", { exact: true }).fill("14 rue des Ateliers");
    await page.getByLabel("Code postal", { exact: true }).fill("75011");
    await page.getByLabel("Ville", { exact: true }).fill("Paris");
    await page.getByRole("button", { name: "Continuer vers le paiement" }).click();

    await page.getByLabel("Titulaire de la carte").fill("Imane Bennani");
    await page.getByLabel("Numéro de carte").type("4242424242424242");
    await page.getByLabel("Expiration").type("1230");
    await page.getByLabel("Cryptogramme").fill("123");

    await expect(page.getByRole("button", { name: /Payer/ })).toBeDisabled();
    await expect(page.getByText("Cochez les conditions de vente pour payer.")).toBeVisible();
  });

  test("a past expiry date is rejected", async ({ page }) => {
    await page.getByLabel("E-mail", { exact: true }).fill("imane@example.fr");
    await page.getByLabel("Prénom", { exact: true }).fill("Imane");
    await page.getByLabel("Nom", { exact: true }).fill("Bennani");
    await page.getByLabel("Téléphone", { exact: true }).type("0624180733");
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();
    await page.getByLabel("Adresse", { exact: true }).fill("14 rue des Ateliers");
    await page.getByLabel("Code postal").fill("75011");
    await page.getByLabel("Ville").fill("Paris");
    await page.getByRole("button", { name: "Continuer vers le paiement" }).click();

    const expiry = page.getByLabel("Expiration", { exact: true });
    await expiry.fill("01/20");
    await expiry.blur();
    await expect(page.getByText("Cette date est déjà passée.")).toBeVisible();
  });

  test("completed steps collapse and can be reopened", async ({ page }) => {
    await page.getByLabel("E-mail", { exact: true }).fill("imane@example.fr");
    await page.getByLabel("Prénom", { exact: true }).fill("Imane");
    await page.getByLabel("Nom", { exact: true }).fill("Bennani");
    await page.getByLabel("Téléphone", { exact: true }).type("0624180733");
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();

    await expect(page.getByText("imane@example.fr")).toBeVisible();
    await page.getByRole("button", { name: "Modifier" }).first().click();
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue("imane@example.fr");
  });

  test("checkout with an empty cart falls back to the empty state", async ({ page }) => {
    await gotoClean(page, `${FR}/checkout`);
    await expect(page.getByText("Votre panier est vide")).toBeVisible();
    await expect(page.getByRole("link", { name: "Parcourir le catalogue" })).toBeVisible();
  });

  test("the order is gone from the cart after payment", async ({ page }) => {
    await page.getByLabel("E-mail", { exact: true }).fill("imane@example.fr");
    await page.getByLabel("Prénom", { exact: true }).fill("Imane");
    await page.getByLabel("Nom", { exact: true }).fill("Bennani");
    await page.getByLabel("Téléphone", { exact: true }).type("0624180733");
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();
    await page.getByLabel("Adresse", { exact: true }).fill("14 rue des Ateliers");
    await page.getByLabel("Code postal", { exact: true }).fill("75011");
    await page.getByLabel("Ville", { exact: true }).fill("Paris");
    await page.getByRole("button", { name: "Continuer vers le paiement" }).click();
    await page.getByLabel("Titulaire de la carte").fill("Imane Bennani");
    await page.getByLabel("Numéro de carte").type("4242424242424242");
    await page.getByLabel("Expiration").type("1230");
    await page.getByLabel("Cryptogramme").fill("123");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Payer/ }).click();
    await expect(page).toHaveURL(/\/fr\/order\//, { timeout: 15_000 });

    await expect(dockBadge(page, "cart-badge")).toHaveCount(0);
    await dockGoto(page, /Panier/);
    await expect(page.getByText("Votre panier est vide")).toBeVisible();
  });
});
