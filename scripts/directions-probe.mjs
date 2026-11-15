// Product-card verification probe (Playwright).
// Verifies the production product card renders, stays interactive and fits the
// viewport in both locales, and captures screenshots for review.
// Usage: node scripts/directions-probe.mjs [baseUrl]
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:3001";
const OUT = "C:/Users/MyHomehP/Desktop/work/ecom/hanutek/.qwen/tmp/directions";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 900, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

const failures = [];
const notes = [];
const check = (label, ok, detail) => {
  if (ok) notes.push(`PASS ${label} — ${detail}`);
  else failures.push(`FAIL ${label} — ${detail}`);
};

const browser = await chromium.launch();

for (const locale of ["fr", "ar"]) {
  for (const vp of VIEWPORTS) {
    const tag = `${locale}@${vp.name}`;
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(`${BASE}/${locale}`, { waitUntil: "networkidle" });
    await page.locator("#selection").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const info = await page.evaluate(() => {
      const grid = document.querySelector("#direction-grid");
      const cards = [...document.querySelectorAll("#selection article")];
      const buttons = (card) => [...card.querySelectorAll("button")];
      return {
        gridChildren: grid ? grid.children.length : -1,
        cards: cards.length,
        titled: cards.filter(
          (c) => (c.querySelector("h3")?.innerText ?? "").trim().length > 0,
        ).length,
        priced: cards.filter((c) =>
          [...c.querySelectorAll("span[dir='ltr']")].some((s) =>
            /\d/.test(s.innerText),
          ),
        ).length,
        addButtons: cards.filter((c) =>
          buttons(c).some((b) => /panier|السلة/.test(b.getAttribute("aria-label") ?? "")),
        ).length,
        soldOut: cards.filter((c) =>
          buttons(c).some((b) => b.disabled),
        ).length,
        cartIcons: cards.filter((c) =>
          buttons(c).some((b) => b.querySelector("svg") && /panier|السلة/.test(b.getAttribute("aria-label") ?? "")),
        ).length,
        favButtons: cards.filter(
          (c) => c.querySelector("button[aria-pressed]") !== null,
        ).length,
        clipped: cards.filter((c) => c.scrollWidth > c.clientWidth + 1).length,
        short: cards.filter((c) => c.getBoundingClientRect().height < 40).length,
      };
    });

    const scrollW = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );

    check(
      `${tag} card-renders`,
      info.cards === 12 &&
        info.gridChildren === 12 &&
        info.titled === 12 &&
        info.priced === 12,
      `cards=${info.cards} grid=${info.gridChildren} titled=${info.titled} priced=${info.priced}`,
    );
    check(
      `${tag} card-cta-and-fav`,
      info.addButtons === 10 &&
        info.soldOut === 2 &&
        info.cartIcons === 10 &&
        info.favButtons === 12,
      `add=${info.addButtons} cartIcons=${info.cartIcons} soldOut=${info.soldOut} fav=${info.favButtons}`,
    );
    check(
      `${tag} card-fits-viewport`,
      scrollW <= vp.width + 1 && info.clipped === 0 && info.short === 0,
      `scrollWidth=${scrollW} viewport=${vp.width} clipped=${info.clipped} short=${info.short}`,
    );

    const addHandle = await page.evaluateHandle(() => {
      const card = document.querySelector("#selection article");
      return (
        [...card.querySelectorAll("button")].find((b) =>
          /panier|السلة/.test(b.getAttribute("aria-label") ?? ""),
        ) ?? null
      );
    });
    const addEl = addHandle.asElement();
    if (addEl) {
      await addEl.click();
      await page.waitForTimeout(140);
      const label = await page.evaluate(
        (el) => el.getAttribute("aria-label"),
        addEl,
      );
      check(
        `${tag} card-add-to-cart`,
        /Ajouté|تمت/.test(label ?? ""),
        `aria-label="${label}"`,
      );
    } else {
      check(`${tag} card-add-to-cart`, false, "add button not found");
    }

    const favHandle = await page.evaluateHandle(
      () =>
        document.querySelector("#selection article button[aria-pressed]") ??
        null,
    );
    const favEl = favHandle.asElement();
    if (favEl) {
      await favEl.click();
      await page.waitForTimeout(120);
      const on = await page.evaluate(
        (el) => el.getAttribute("aria-pressed"),
        favEl,
      );
      await favEl.click();
      await page.waitForTimeout(120);
      const off = await page.evaluate(
        (el) => el.getAttribute("aria-pressed"),
        favEl,
      );
      check(
        `${tag} card-favourite-toggle`,
        on === "true" && off === "false",
        `pressed ${on} -> ${off}`,
      );
    } else {
      check(`${tag} card-favourite-toggle`, false, "fav button not found");
    }

    if (locale === "fr") {
      await page.evaluate(() => {
        const grid = document.querySelector("#direction-grid");
        if (grid) grid.scrollIntoView({ block: "start" });
      });
      await page.mouse.wheel(0, 2400);
      await page.waitForTimeout(350);
      await page.mouse.wheel(0, -4800);
      await page.waitForTimeout(400);
      if (vp.name === "desktop") {
        await page
          .locator("#direction-grid")
          .screenshot({ path: `${OUT}/card-desktop.png`, animations: "disabled" });
      }
      if (vp.name === "mobile") {
        await page
          .locator("#selection article")
          .first()
          .screenshot({ path: `${OUT}/card-mobile.png`, animations: "disabled" });
      }
    }

    check(
      `${tag} no-console-errors`,
      errors.length === 0,
      errors.slice(0, 3).join(" | ") || "clean",
    );
    await page.close();
  }
}

await browser.close();

console.log(notes.join("\n"));
if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S):`);
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log(`\nAll ${notes.length} checks passed.`);
