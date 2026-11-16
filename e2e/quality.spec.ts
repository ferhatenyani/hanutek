import { expect, test } from "@playwright/test";
import {
  AR,
  FR,
  addCard,
  expectNoHorizontalOverflow,
  gotoClean,
  openSheetByCard,
  watchErrors,
} from "./helpers";

const ROUTES = [
  `${FR}`,
  `${FR}/products`,
  `${FR}/product/p1`,
  `${FR}/product/p8`,
  `${FR}/cart`,
  `${FR}/checkout`,
  `${FR}/favorites`,
  `${FR}/login`,
  `${FR}/profile`,
  `${AR}`,
  `${AR}/products`,
  `${AR}/cart`,
  `${AR}/login`,
];

test.describe("render quality", () => {
  for (const route of ROUTES) {
    test(`no console or page errors on ${route}`, async ({ page }) => {
      const watcher = watchErrors(page);
      await page.goto(route, { waitUntil: "load" });
      await page.waitForTimeout(400);
      watcher.expectClean();
    });
  }
});

test.describe("layout integrity", () => {
  for (const path of [FR, `${FR}/products`, `${FR}/product/p1`, `${FR}/checkout`, AR]) {
    test(`no horizontal overflow at 360px on ${path}`, async ({ page }) => {
      await gotoClean(page, path);
      await expectNoHorizontalOverflow(page);
    });
  }

  test("the dock clears content on mobile and lives only there", async ({ page }) => {
    await gotoClean(page, FR);
    const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
    const dock = page.getByTestId("dock");

    if (desktop) {
      await expect(dock).toBeHidden();
      await expect(page.getByTestId("desktop-nav")).toBeVisible();
      return;
    }

    await page.getByTestId("product-card").last().scrollIntoViewIfNeeded();
    const dockBox = await dock.boundingBox();
    const card = await page.getByTestId("product-card").last().boundingBox();
    // Either the card clears the dock, or the user has scrolled past it.
    const clears = card!.y + card!.height <= dockBox!.y + 4;
    const scrolledBelow = card!.y < dockBox!.y;
    expect(clears || scrolledBelow).toBe(true);
  });

  test("every visible control meets the touch minimum", async ({ page }) => {
    await gotoClean(page, FR);
    await addCard(page, 0);
    const small = await page.evaluate(() => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (!coarse) return [];
      return Array.from(
        document.querySelectorAll<HTMLElement>(
          'button, input:not([type="hidden"]), select, [role="checkbox"], [role="switch"]',
        ),
      )
        .filter((node) => node.offsetParent !== null)
        .filter((node) => !node.className.includes("sr-only"))
        .filter((node) => node.getBoundingClientRect().height < 36)
        .map(
          (node) =>
            `${node.tagName}[${node.getAttribute("id") ?? node.getAttribute("type") ?? ""}] "${
              node.getAttribute("aria-label") ?? (node.textContent ?? "").trim()
            }" ${Math.round(node.getBoundingClientRect().height)}px in ${
              node.closest("section,aside,footer,main")?.tagName ?? "?"
            }`,
        );
    });
    expect(small).toEqual([]);
  });

  test("the sheet keeps a visible strip of the shop and covers 70%+", async ({ page }) => {
    await gotoClean(page, FR);
    await openSheetByCard(page, 0);
    const panel = await page.getByTestId("sheet-panel").boundingBox();
    const viewport = page.viewportSize()!;
    expect(panel!.height / viewport.height).toBeGreaterThan(0.7);
    expect(panel!.y).toBeGreaterThan(0);
  });
});

test.describe("no browser defaults survive", () => {
  test("inputs, buttons and selects carry the app type scale", async ({ page }) => {
    await gotoClean(page, `${FR}/login`);
    const email = page.getByLabel("E-mail", { exact: true });
    const styles = await email.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        font: computed.fontFamily,
        radius: computed.borderRadius,
        appearance: computed.appearance,
      };
    });
    expect(styles.font).toMatch(/generalsans/i);
    expect(styles.radius).toBe("12px");
    expect(styles.appearance).toBe("none");

    const button = page.getByRole("button", { name: "Se connecter" });
    const buttonFont = await button.evaluate((node) => getComputedStyle(node).fontFamily);
    expect(buttonFont).toMatch(/generalsans/i);
  });

  test("focus is always visible on keyboard navigation", async ({ page }) => {
    await gotoClean(page, FR);
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const node = document.activeElement as HTMLElement;
      const style = getComputedStyle(node);
      return { outline: style.outlineWidth, tag: node.tagName };
    });
    expect(outline.tag).not.toBe("BODY");
    expect(parseFloat(outline.outline)).toBeGreaterThanOrEqual(2);
  });

  test("the page background is the token canvas, not the UA white", async ({ page }) => {
    await gotoClean(page, FR);
    const background = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor,
    );
    expect(background).toBe("rgb(255, 255, 255)");
    const section = await page.evaluate(() => {
      const node = document.querySelector("section.bg-canvas, .bg-canvas");
      return node ? getComputedStyle(node).backgroundColor : null;
    });
    expect(section).toBe("rgb(247, 248, 250)");
  });
});

test.describe("reduced motion", () => {
  test("the sheet still opens and closes without animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoClean(page, FR);
    await openSheetByCard(page, 0);
    await expect(page.getByTestId("sheet-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("sheet-panel")).toHaveCount(0);
  });
});
