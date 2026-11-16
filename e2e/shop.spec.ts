import { expect, test } from "@playwright/test";
import { AR, FR, addCard, dockBadge, dockGoto, gotoClean, watchErrors } from "./helpers";

test.describe("storefront shell", () => {
  test("home renders the promo deck, two dot-paginated rails and the service band", async ({
    page,
  }) => {
    const watcher = watchErrors(page);
    await gotoClean(page, FR);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coups de cœur" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nouveautés & essentiels" })).toBeVisible();

    // Six cards per rail, all mounted in the horizontal scroll rows.
    await expect(page.getByTestId("product-card")).toHaveCount(12);
    await expect(page.getByRole("link", { name: "Voir plus" })).toHaveCount(2);

    // Dots: two for the promo deck plus six per rail; arrows for both rails.
    await expect(page.getByRole("tab")).toHaveCount(14);
    await expect(page.getByRole("button", { name: "Articles suivants" })).toHaveCount(2);

    await expect(page.getByRole("heading", { name: "Notre engagement" })).toBeAttached();
    await expect(page.getByText("Commande préparée le jour même avant 15 h.")).toBeVisible();
    watcher.expectClean();
  });

  test("rail dots and arrows page the horizontal section", async ({ page }) => {
    await gotoClean(page, FR);
    const rail = page.getByTestId("rail-scroll").first();
    const before = await rail.evaluate((node) => node.scrollLeft);
    await page.getByRole("button", { name: "Articles suivants" }).first().click();
    await expect
      .poll(() => rail.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(before);
  });

  test("the header search offers real suggestions and opens the product sheet", async ({
    page,
  }) => {
    await gotoClean(page, FR);
    const search = page.locator("header").locator("input[role='combobox']:visible").first();
    await search.fill("caméra");
    const listbox = page.getByRole("listbox", { name: "Suggestions de recherche" });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option").first()).toBeVisible();
    await listbox.getByRole("option").first().click();
    await expect(page).toHaveURL(/\/fr\/product\/p\d+$/);
    await expect(page.getByTestId("sheet-panel")).toBeVisible();
  });

  test("navigation reflects the current route and the device", async ({ page }) => {
    await gotoClean(page, FR);
    const dock = page.getByTestId("dock");
    const desktop = (page.viewportSize()?.width ?? 0) >= 1024;

    if (desktop) {
      // The dock is mobile/tablet only; desktop keeps navigation in the header.
      await expect(dock).toBeHidden();
      const header = page.getByTestId("desktop-nav");
      await expect(header).toBeVisible();
      await expect(header.locator('a[href="/fr"]')).toHaveCount(1);
      await expect(header.locator('a[href="/fr/products"]')).toHaveCount(1);
      await expect(page.getByTestId("header-favorites")).toBeVisible();
      await expect(page.getByTestId("header-cart")).toBeVisible();
      await expect(page.getByTestId("header-account")).toBeVisible();
    } else {
      await expect(dock).toBeVisible();
      await expect(dock.getByRole("link")).toHaveCount(5);
      for (const href of ["/fr", "/fr/products", "/fr/favorites", "/fr/cart", "/fr/profile"]) {
        await expect(dock.locator(`a[href="${href}"]`)).toHaveCount(1);
      }
    }

    await dockGoto(page, /Catalogue/);
    await expect(page).toHaveURL(/\/fr\/products$/);
  });

  test("cart badge counts items and survives a reload", async ({ page }) => {
    await gotoClean(page, FR);
    await addCard(page, 0);
    await addCard(page, 1);

    await expect(dockBadge(page, "cart-badge")).toHaveText("2");

    await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForSelector("html[data-hydrated]");
    await expect(dockBadge(page, "cart-badge")).toHaveText("2");
  });

  test("language switch keeps the current page", async ({ page }) => {
    await gotoClean(page, `${FR}/products`);
    await page.getByRole("button", { name: "Choix de la langue" }).click();
    await page.getByRole("option", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/products$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("arabic home is right-to-left and free of latin leftovers", async ({ page }) => {
    const watcher = watchErrors(page);
    await gotoClean(page, AR);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("أساسيات");
    expect(await page.locator("main").innerText()).not.toMatch(/\bAjouter\b/);
    watcher.expectClean();
  });

  test("footer links and newsletter stay reachable above the dock", async ({ page }) => {
    await gotoClean(page, FR);
    // The dock floats above the page on phones/tablets, so the footer reserves
    // clearance there; desktop has header navigation and needs no reserve.
    const padding = await page
      .locator("footer .border-t")
      .last()
      .evaluate((node) => getComputedStyle(node).paddingBottom);
    const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
    expect(parseFloat(padding)).toBeGreaterThanOrEqual(desktop ? 20 : 100);
  });
});

test.describe("catalogue", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page, `${FR}/products`);
  });

  test("lists every product and filters by category", async ({ page }) => {
    await expect(page.getByTestId("product-card")).toHaveCount(12);

    await page.getByRole("button", { name: "Caméras & recul" }).click();
    await expect(page.getByTestId("product-card")).toHaveCount(2);
    await expect(page.getByText("2 articles", { exact: true })).toBeVisible();
  });

  test("price and stock facets each narrow the grid", async ({ page }) => {
    // Phones and tablets keep the facet set in a sheet; desktop shows the same
    // controls in the independently scrolling filter rail.
    const openFilters = page.getByRole("button", { name: "Filtres", exact: true });
    const sheet = await openFilters.isVisible().catch(() => false);
    if (sheet) await openFilters.click();
    const scope = sheet ? page.getByRole("dialog") : page;

    await scope.getByRole("button", { name: "5 000 - 9 999 DA" }).click();
    await expect(page.getByTestId("product-card")).toHaveCount(5);

    await scope.getByRole("switch", { name: "En stock" }).click();
    await expect(page.getByTestId("product-card")).toHaveCount(3);
  });

  test("sorting reorders by price", async ({ page }) => {
    await page.getByRole("button", { name: /Trier les produits/ }).click();
    await page.getByRole("option", { name: "Prix croissant" }).click();
    await expect(page.getByTestId("product-card").first()).toContainText(/2\s200\sDA/);
  });

  test("search narrows the grid and can be cleared", async ({ page }) => {
    const search = page.locator("main").getByRole("combobox");
    await search.fill("gonfleur");
    await expect(page.getByTestId("product-card")).toHaveCount(1);

    await page.locator("main").getByRole("button", { name: "Effacer la recherche" }).click();
    await expect(page.getByTestId("product-card")).toHaveCount(12);
  });

  test("an impossible combination shows the empty state with a reset", async ({ page }) => {
    await page.locator("main").getByRole("combobox").fill("zzzz");
    await expect(page.getByText("Aucun produit ne correspond")).toBeVisible();
    await page.getByRole("button", { name: "Réinitialiser" }).last().click();
    await expect(page.getByTestId("product-card")).toHaveCount(12);
  });

  test("out-of-stock products are marked and their CTA is disabled", async ({ page }) => {
    const soldOut = page.getByTestId("product-card").filter({ hasText: "Kit ampoules LED H7" });
    await expect(soldOut.getByTestId("card-add")).toBeDisabled();
    await expect(soldOut.getByText("Indisponible")).toBeVisible();
  });

  test("deep link ?cat= preselects the category", async ({ page }) => {
    await page.goto(`${FR}/products?cat=power`);
    await expect(page.getByTestId("product-card")).toHaveCount(3);
    // The rail button's accessible name carries its count; the chip-remove
    // button's label starts with "Retirer", so anchor at the start.
    await expect(
      page.getByRole("button", { name: /^Démarrage & diagnostic/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
