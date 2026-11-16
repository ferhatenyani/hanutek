import { expect, test } from "@playwright/test";
import {
  AR,
  FR,
  addCard,
  dockBadge,
  dockGoto,
  gotoClean,
  toggleFavorite,
  visibleCards,
  watchErrors,
} from "./helpers";

test.describe("mock sign-in", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page, `${FR}/login`);
  });

  test("the form explains that no real account is created", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Se connecter à Hanutek",
    );
    await expect(page.getByText("Mode démonstration")).toBeVisible();
  });

  test("empty fields are reported per field", async ({ page }) => {
    const login = page.getByTestId("login-form");
    await login.getByRole("button", { name: "Se connecter" }).click();
    await expect(login.getByRole("alert")).toHaveCount(2);
    await expect(login.getByLabel("E-mail", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(login.getByLabel("Mot de passe", { exact: true })).toHaveAttribute("aria-invalid", "true");
  });

  test("a malformed address and a short password are rejected", async ({ page }) => {
    const login = page.getByTestId("login-form");
    await login.getByLabel("E-mail", { exact: true }).fill("imane@nope");
    await login.getByLabel("Mot de passe", { exact: true }).fill("123");
    await login.getByRole("button", { name: "Se connecter" }).click();
    await expect(login.getByText("Le format n'est pas valide.")).toHaveCount(2);
    await expect(page).toHaveURL(/\/fr\/login/);
  });

  test("a valid pair signs in and lands on the profile", async ({ page }) => {
    const watcher = watchErrors(page);
    const login = page.getByTestId("login-form");
    await login.getByLabel("E-mail", { exact: true }).fill("imane.bennani@example.fr");
    await login.getByLabel("Mot de passe", { exact: true }).fill("motdepasse");
    await login.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/fr\/profile$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bonjour Imane Bennani");
    await expect(page.getByText("imane.bennani@example.fr")).toBeVisible();
    await expect(page.getByText("Client depuis")).toBeVisible();
    watcher.expectClean();
  });

  test("the Google button signs into the same local session", async ({ page }) => {
    const watcher = watchErrors(page);
    await page.getByTestId("google-login").click();
    await expect(page).toHaveURL(/\/fr\/profile$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bonjour Imane Bennani");
    watcher.expectClean();
  });

  test("the password can be revealed and hidden again", async ({ page }) => {
    const login = page.getByTestId("login-form");
    const password = login.getByLabel("Mot de passe", { exact: true });
    await password.fill("secret1");
    await expect(password).toHaveAttribute("type", "password");
    await login.getByRole("button", { name: "Afficher le mot de passe" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await login.getByRole("button", { name: "Masquer le mot de passe" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("signing out clears the session and the page guards again", async ({ page }) => {
    const login = page.getByTestId("login-form");
    await login.getByLabel("E-mail", { exact: true }).fill("nadia.ouazzani@example.fr");
    await login.getByLabel("Mot de passe", { exact: true }).fill("motdepasse");
    await login.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/fr\/profile$/, { timeout: 10_000 });

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/fr\/login\?next=\/profile$/, { timeout: 10_000 });
  });

  test("checkout never requires an account", async ({ page }) => {
    await gotoClean(page, FR);
    await addCard(page, 0);
    await dockGoto(page, /Panier/);
    await page.getByRole("button", { name: /Passer à la caisse/ }).click();
    await expect(page).toHaveURL(/\/fr\/checkout$/);
    await expect(page.getByLabel("Nom complet")).toBeVisible();
  });
});

test.describe("favourites", () => {
  test("a card heart drives the dock badge and the favourites page", async ({ page }) => {
    await gotoClean(page, FR);
    await toggleFavorite(page, 3);
    await expect(dockBadge(page, "favorites-badge")).toHaveText("1");

    await toggleFavorite(page, 5);
    await expect(dockBadge(page, "favorites-badge")).toHaveText("2");

    await dockGoto(page, /Favoris/);
    await expect(page).toHaveURL(/\/fr\/favorites$/);
    await expect(visibleCards(page)).toHaveCount(2);
    await expect(page.getByText("2 articles suivis")).toBeVisible();
  });

  test("un-favouriting from the list empties it with a composed state", async ({ page }) => {
    await gotoClean(page, FR);
    await toggleFavorite(page, 1);
    await dockGoto(page, /Favoris/);

    await toggleFavorite(page, 0);
    await expect(page.getByText("Aucun favori pour l'instant")).toBeVisible();
    await expect(page.getByRole("link", { name: "Parcourir le catalogue" })).toBeVisible();
  });

  test("favourites persist across a reload", async ({ page }) => {
    await gotoClean(page, FR);
    await toggleFavorite(page, 2);
    await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForSelector("html[data-hydrated]");
    await expect(dockBadge(page, "favorites-badge")).toHaveText("1");
  });
});

test.describe("order history", () => {
  test("a confirmed order appears in the account", async ({ page }) => {
    await gotoClean(page, `${FR}/login`);
    await page.getByLabel("E-mail", { exact: true }).fill("thomas.ferrand@example.fr");
    await page.getByLabel("Mot de passe", { exact: true }).fill("motdepasse");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Aucune commande pour l'instant")).toBeVisible();

    await dockGoto(page, /^Accueil/);
    await addCard(page, 4);
    await dockGoto(page, /Panier/);
    await page.getByRole("button", { name: /Passer à la caisse/ }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nom complet").fill("Thomas Ferrand");
    await dialog.getByLabel("Numéro de téléphone").fill("0560123456");
    await dialog.getByLabel("Adresse complète").fill("Oran, Es Sénia, cité 200 logts");
    await dialog.getByRole("button", { name: /Confirmer la commande/ }).click();
    await expect(page).toHaveURL(/\/fr\/order\//, { timeout: 15_000 });

    await expect(page.getByText("Oran, Es Sénia, cité 200 logts")).toBeVisible();

    await dialog.getByRole("link", { name: "Suivre ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/profile$/, { timeout: 10_000 });
    await expect(page.getByText("1 commande")).toBeVisible();
    await expect(page.getByRole("link", { name: /HT-\d{6}-\d{3}/ })).toBeVisible();
  });
});

test.describe("arabic storefront", () => {
  test("the sheet, cart and dock work right-to-left", async ({ page }) => {
    const watcher = watchErrors(page);
    await gotoClean(page, AR);

    await addCard(page, 0);
    await expect(dockBadge(page, "cart-badge")).toHaveText("1");

    await dockGoto(page, /السلة/);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("cart-line")).toHaveCount(1);
    await expect(dialog.getByRole("button", { name: /الانتقال إلى الدفع/ })).toHaveCount(1);

    await page.getByTestId("sheet-panel").getByRole("button", { name: "إغلاق" }).click();
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
    watcher.expectClean();
  });

  test("the product sheet is legible in Arabic", async ({ page }) => {
    await gotoClean(page, AR);
    await page.getByTestId("product-card").nth(1).getByRole("link").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Vistar").first()).toBeVisible();
    await expect(dialog.getByRole("button", { name: "أضف", exact: true })).toBeEnabled();
  });
});
