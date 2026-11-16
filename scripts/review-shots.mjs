// Visual review captures: node scripts/review-shots.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3200";
const OUT = new URL("../.qwen/tmp/review/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(name, { width, height, path, steps = [], full = false }) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("html[data-hydrated]", { timeout: 20000 });
  await page.waitForTimeout(700);
  for (const step of steps) await step(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT + name + ".png", fullPage: full });
  await page.close();
  console.log("shot", name);
}

const addFirst = async (page) => {
  await page.getByTestId("product-card").first().getByTestId("card-add").click();
  await page.waitForTimeout(900);
};
const openCart = async (page) => {
  await page
    .locator('[data-testid="header-cart"]:visible, [data-testid="header-cart-compact"]:visible')
    .first()
    .click();
  await page.waitForTimeout(700);
};
const openCheckout = async (page) => {
  await page.getByRole("button", { name: /Passer à la caisse/ }).click();
  await page.waitForTimeout(700);
};

await shot("home-mobile", { width: 390, height: 844, path: "/fr", full: true });
await shot("home-desktop", { width: 1440, height: 900, path: "/fr" });
await shot("home-desktop-full", { width: 1440, height: 900, path: "/fr", full: true });
await shot("products-desktop", { width: 1440, height: 900, path: "/fr/products" });
await shot("products-mobile", { width: 390, height: 844, path: "/fr/products" });
await shot("sheet-product-desktop", {
  width: 1440, height: 900, path: "/fr",
  steps: [async (p) => { await p.getByTestId("product-card").first().getByRole("link").first().click(); await p.waitForTimeout(800); }],
});
await shot("sheet-product-mobile", {
  width: 390, height: 844, path: "/fr",
  steps: [async (p) => { await p.getByTestId("product-card").first().getByRole("link").first().click(); await p.waitForTimeout(800); }],
});
await shot("sheet-cart-desktop", { width: 1440, height: 900, path: "/fr", steps: [addFirst, openCart] });
await shot("sheet-checkout-desktop", { width: 1440, height: 900, path: "/fr", steps: [addFirst, openCart, openCheckout] });
await shot("sheet-checkout-mobile", { width: 390, height: 844, path: "/fr", steps: [addFirst, openCart, openCheckout] });
await shot("login-mobile", { width: 390, height: 844, path: "/fr/login", full: true });
await shot("footer-desktop", {
  width: 1440, height: 900, path: "/fr",
  steps: [async (p) => { await p.locator("footer").scrollIntoViewIfNeeded(); await p.waitForTimeout(400); }],
});
await shot("home-arabic-mobile", { width: 390, height: 844, path: "/ar", full: true });

await browser.close();
console.log("done");
