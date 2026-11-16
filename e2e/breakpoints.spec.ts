import { expect, test } from "@playwright/test";
import { FR, expectNoHorizontalOverflow, gotoClean } from "./helpers";

/**
 * Custom breakpoint matrix: the widths between the common Tailwind stops are
 * exactly where the old navbar and dock broke, so every in-between width is
 * exercised, not just 360/768/1024/1440.
 */
const WIDTHS = [360, 375, 390, 480, 640, 700, 768, 820, 900, 950, 1023, 1024, 1100, 1180, 1280, 1440];

for (const width of WIDTHS) {
  test.describe(`viewport ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("home and catalogue keep their layout and chrome intact", async ({ page }) => {
      await gotoClean(page, FR);
      await expectNoHorizontalOverflow(page);

      const header = page.locator("header").first();
      const desktopSearch = header.locator("#header-search");
      const mobileSearch = header.locator("#header-search-mobile");
      if (width >= 768) {
        await expect(desktopSearch).toBeVisible();
        await expect(mobileSearch).toBeHidden();
      } else {
        await expect(mobileSearch).toBeVisible();
        await expect(desktopSearch).toBeHidden();
      }

      // The cart control exists at every width, in one of its two forms.
      const pill = page.getByTestId("header-cart");
      const compact = page.getByTestId("header-cart-compact");
      if (width >= 1024) {
        await expect(pill).toBeVisible();
        await expect(compact).toBeHidden();
      } else {
        await expect(compact).toBeVisible();
        await expect(pill).toBeHidden();
      }

      const dock = page.getByTestId("dock");
      if (width >= 1024) {
        await expect(dock).toBeHidden();
      } else {
        await expect(dock).toBeVisible();
        // The nav spans the viewport; the floating bar inside is what sizes down.
        const box = (await dock.locator("ul").boundingBox())!;
        // Tablets get the narrow bar; phones the wider one.
        expect(box.width).toBeLessThanOrEqual(width < 640 ? 584 : 444);
      }

      await page.goto(`${FR}/products`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("html[data-hydrated]");
      await expectNoHorizontalOverflow(page);
      await expect(page.getByTestId("product-card").first()).toBeVisible();
    });

    test("the product sheet keeps its top strip and column cap", async ({ page }) => {
      await gotoClean(page, FR);
      await page.getByTestId("product-card").first().getByRole("link").first().click();
      const panel = page.getByTestId("sheet-panel");
      await expect(panel).toBeVisible();
      const box = (await panel.boundingBox())!;
      expect(box.y).toBeGreaterThan(0);
      expect(box.height / 900).toBeGreaterThan(0.7);
      // Full available horizontal space (minus the reserved scrollbar gutter).
      expect(box.width).toBeGreaterThanOrEqual(width - 12);
    });
  });
}

test.describe("independent scroll panes on desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("wheel over the filters scrolls only the filters", async ({ page }) => {
    await gotoClean(page, `${FR}/products`);
    const aside = page.locator("aside").first();
    const box = (await aside.boundingBox())!;
    const windowBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 300));
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(250);
    const asideScroll = await aside.evaluate((node) => node.scrollTop);
    const windowAfter = await page.evaluate(() => window.scrollY);
    expect(asideScroll).toBeGreaterThan(0);
    expect(windowAfter).toBe(windowBefore);
  });

  test("wheel over the products scrolls only the products", async ({ page }) => {
    await gotoClean(page, `${FR}/products`);
    const grid = page.locator("main section[aria-label]").last();
    const box = (await grid.boundingBox())!;
    const windowBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 300));
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(250);
    const gridScroll = await grid.evaluate((node) => node.scrollTop);
    const windowAfter = await page.evaluate(() => window.scrollY);
    expect(gridScroll).toBeGreaterThan(0);
    expect(windowAfter).toBe(windowBefore);
  });
});
