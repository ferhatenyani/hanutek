import { expect, type Locator, type Page } from "@playwright/test";

export const FR = "/fr";
export const AR = "/ar";

/**
 * Collects page-level errors so every spec can fail on a console error or an
 * unhandled exception rather than discovering it in a screenshot later.
 */
export function watchErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  return {
    errors,
    expectClean() {
      expect(errors, errors.join("\n")).toHaveLength(0);
    },
  };
}

/**
 * Loads a route with an empty slate and waits until the app is actually
 * interactive.
 *
 * `networkidle` is the wrong signal here: the router keeps prefetching the
 * links on the page, so it settles late or not at all. The layout writes
 * `data-hydrated` in a mount effect, which is exactly the moment static markup
 * becomes a live React tree.
 */
export async function gotoClean(page: Page, path: string) {
  await page.goto(path, { waitUntil: "commit" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("html[data-hydrated]", { timeout: 20_000 });
}

/**
 * Scrolls a target to the vertical centre of the viewport, instantly.
 *
 * Two reasons. The app sets CSS smooth scrolling, which makes Playwright keep
 * re-checking a moving element; and the floating dock is fixed over the bottom
 * of the screen, so a control that merely counts as "visible" near the bottom
 * edge is in fact covered by it and its click gets intercepted forever.
 */
export async function centerInViewport(target: Locator) {
  await target.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
}

/** Dock counters exist in both the desktop and mobile copy; assert the first. */
export function dockBadge(page: Page, id: string) {
  return page.getByTestId("dock").getByTestId(id).first();
}

/** Adds the nth card on the current grid to the cart and waits for the badge. */
export async function addCard(page: Page, index = 0) {
  const card = page.getByTestId("product-card").nth(index);
  await expect(card).toBeVisible();
  await centerInViewport(card);

  const read = () =>
    dockBadge(page, "cart-badge")
      .textContent()
      .then((value) => Number(value ?? 0))
      .catch(() => 0);

  const before = await read();
  await card.getByTestId("card-add").click();
  // The badge is the durable signal; the toast disappears on its own.
  await expect
    .poll(read, { message: "the dock cart badge should count the added line" })
    .toBeGreaterThan(before);
}

/** Taps the heart on the nth card of the current grid. */
export async function toggleFavorite(page: Page, index = 0) {
  const card = page.getByTestId("product-card").nth(index);
  await expect(card).toBeVisible();
  await centerInViewport(card);
  await card.getByRole("button", { name: /favoris|المفضلة/ }).click();
}

/**
 * Navigates with the primary chrome: the bottom dock on phones/tablets, the
 * header navigation on desktop. Both expose the same destination names.
 */
export async function dockGoto(page: Page, name: RegExp | string) {
  const dock = page.getByTestId("dock");
  const dockLink = dock.getByRole("link", { name });
  if (await dockLink.first().isVisible().catch(() => false)) {
    await dockLink.first().click();
    return;
  }

  const header = page.locator("header").first();
  const headerLink = header.getByRole("link", { name });
  if (await headerLink.first().isVisible().catch(() => false)) {
    await headerLink.first().click();
    return;
  }

  const source = typeof name === "string" ? name : name.source;
  const fallback: [RegExp, string][] = [
    [/Panier|السلة/i, "header-cart"],
    [/Compte|حسابي/i, "header-account"],
    [/Favoris|المفضلة/i, "header-favorites"],
  ];
  for (const [pattern, testId] of fallback) {
    if (!pattern.test(source)) continue;
    await page.getByTestId(testId).click();
    return;
  }

  throw new Error(`No visible navigation target for ${source}`);
}

export async function openSheetByCard(page: Page, index = 0) {
  const card = page.getByTestId("product-card").nth(index);
  await centerInViewport(card);
  await card.getByRole("link").first().click();
  await expect(page.getByTestId("sheet-panel")).toBeVisible();
}

export async function sheetGeometry(page: Page) {
  const panel = page.getByTestId("sheet-panel");
  const scrim = page.getByTestId("sheet-scrim");
  const box = (await panel.boundingBox())!;
  const viewport = page.viewportSize()!;

  const styles = await panel.evaluate((node) => ({
    backdrop: getComputedStyle(node).backdropFilter ?? "",
    radius: getComputedStyle(node).borderTopLeftRadius,
  }));
  const scrimStyles = await scrim.evaluate((node) => ({
    filter: getComputedStyle(node).backdropFilter,
    background: getComputedStyle(node).backgroundColor,
  }));
  const locked = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    overflow: getComputedStyle(document.documentElement).overflow,
  }));

  return {
    box,
    viewport,
    coverage: box.height / viewport.height,
    styles,
    scrimStyles,
    locked,
  };
}

/**
 * Cards on the current page only.
 *
 * Next keeps the previous route's markup in the tree with `display: none`, so
 * a plain `getByTestId` count picks up the page the user just left. Users see
 * nothing wrong; the assertions would be lying.
 */
export function visibleCards(page: Page) {
  return page.locator('[data-testid="product-card"]:visible');
}

export function visibleCartLines(page: Page) {
  return page.locator('[data-testid="cart-line"]:visible');
}

export async function expectNoHorizontalOverflow(page: Page) {
  const width = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  );
  const viewport = page.viewportSize()!.width;
  expect(width).toBeLessThanOrEqual(viewport + 1);
}

/** Scrolls the page and reports whether it actually moved. */
export async function scrollAttempt(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(20, 20);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => window.scrollY);
  return { before, after };
}

export async function scrollToY(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
}
