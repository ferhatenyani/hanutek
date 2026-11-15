// Storefront verification suite (Playwright).
// Asserts geometry, tokens and interaction state — not marketing copy.
// Usage: node scripts/polish-suite.mjs [baseUrl]
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:3001";
const failures = [];
const notes = [];

const check = (label, ok, detail) => {
  if (ok) notes.push(`PASS ${label} — ${detail}`);
  else failures.push(`FAIL ${label} — ${detail}`);
};

const DIGIT = /\d+(?:[.,]\d+)?/;
const priceNumber = (text) => {
  const match = text.replace(/\u202f|\u00a0/g, " ").match(DIGIT);
  return match ? Number(match[0].replace(",", ".")) : NaN;
};

function parseRgb(value) {
  const rgba = value.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const parts = rgba[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }
  const srgb = value.match(
    /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/,
  );
  if (srgb) {
    return {
      r: Number(srgb[1]) * 255,
      g: Number(srgb[2]) * 255,
      b: Number(srgb[3]) * 255,
      a: srgb[4] ? Number(srgb[4]) : 1,
    };
  }
  return null;
}

function blend(fg, bg) {
  const a = fg.a ?? 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function luminance({ r, g, b }) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

async function collectPairs(page) {
  return page.evaluate(() => {
    const bgOf = (element) => {
      let node = element;
      while (node) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
        node = node.parentElement;
      }
      return "rgb(255, 255, 255)";
    };
    const hero = document.querySelector("main section");
    const grid = hero?.firstElementChild;
    const campaign = grid?.children[0];
    const promo = grid?.children[1];
    const cards = [...document.querySelectorAll("#selection article")];
    const card = cards[0];
    const promoCard = cards.find((c) =>
      [...c.querySelectorAll(":scope > div:first-child span")].some((s) =>
        s.textContent.includes("%"),
      ),
    );
    const promoLabel = promoCard?.querySelector(":scope > div:first-child span");
    const promoOld = [...(promo?.querySelectorAll("span") ?? [])].find((s) =>
      getComputedStyle(s).textDecorationLine.includes("line-through"),
    );
    const items = [
      ["hero-subtitle", campaign?.querySelector("h1 + p"), campaign],
      ["hero-cta", campaign?.querySelector('a[href="#selection"]'), null],
      ["promo-label", promo?.querySelector("p"), promo],
      ["promo-old-price", promoOld, promo],
      ["card-title", card?.querySelector("h3"), card],
      ["card-description", card?.querySelector("h3 + p"), card],
      ["card-price", card?.querySelector('h3 + p + div span[dir="ltr"]'), card],
      ["card-label", card?.querySelector(":scope > div:first-child span"), card],
      ["card-label-sale", promoLabel, promoCard],
      ["section-subtitle", document.querySelector("#selection h2 + p"), null],
      ["footer-link", document.querySelector("footer nav a"), document.querySelector("footer")],
    ];
    return items
      .filter(([, element]) => element)
      .map(([name, element]) => ({
        name,
        fg: getComputedStyle(element).color,
        resolvedBg: bgOf(element),
        size: parseFloat(getComputedStyle(element).fontSize),
        weight: getComputedStyle(element).fontWeight,
      }));
  });
}

async function runLocale(browser, locale, viewport) {
  const tag = `${locale}@${viewport.width}`;
  const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(`${BASE}/${locale}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);

  const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
  const isRtl = dir === "rtl";
  const expectedCols =
    viewport.width >= 1280
      ? 4
      : viewport.width >= 768
        ? 3
        : viewport.width >= 360
          ? 2
          : 1;

  // 1. overflow
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  check(
    `${tag} no-horizontal-overflow`,
    scrollW <= viewport.width + 1,
    `scrollWidth=${scrollW} viewport=${viewport.width}`,
  );

  // 2. font token
  const font = await page.evaluate(async () => {
    const family = getComputedStyle(document.body).fontFamily;
    const primary = family.split(",")[0].replace(/["']/g, "").trim();
    await document.fonts.ready;
    return {
      family,
      loaded: document.fonts.check(`16px "${primary}"`),
      rubik: family.toLowerCase().includes("rubik"),
    };
  });
  check(
    `${tag} general-sans-font`,
    !font.rubik && font.loaded,
    `family=${font.family} loaded=${font.loaded} rubik=${font.rubik}`,
  );

  // 3. header: compact, no rule, custom language, search placement
  const header = await page.evaluate(() => {
    const el = document.querySelector("header");
    const row = el.firstElementChild;
    const rect = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return r.width && r.height
        ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
        : null;
    };
    const logo = row.querySelector("a");
    const nav = row.querySelector("nav");
    const form = row.querySelector('form[role="search"]');
    const actions = row.lastElementChild;
    return {
      height: el.getBoundingClientRect().height,
      borderBottom: parseFloat(getComputedStyle(el).borderBottomWidth),
      shadow: getComputedStyle(el).boxShadow,
      logo: rect(logo),
      nav: rect(nav),
      form: rect(form),
      actions: rect(actions),
      langTriggers: el.querySelectorAll('button[aria-haspopup="listbox"]').length,
      searchToggle: rect(el.querySelector('button[aria-controls="mobile-search"]')),
      menuToggle: rect([...el.querySelectorAll("button[aria-expanded]")].at(-1)),
      account: rect(
        [...el.querySelectorAll("a")].find((a) =>
          /Se connecter|تسجيل الدخول/.test(a.textContent ?? ""),
        ),
      ),
    };
  });
  check(
    `${tag} header-compact-no-rule`,
    Math.abs(header.height - (viewport.width >= 1024 ? 72 : 64)) <= 1 &&
      header.borderBottom === 0,
    `height=${header.height} border=${header.borderBottom} shadow=${header.shadow === "none" ? "none" : "present"}`,
  );
  check(
    `${tag} lang-is-custom-listbox`,
    header.langTriggers === 1,
    `header listbox triggers=${header.langTriggers}`,
  );
  if (viewport.width >= 1024) {
    const overlap = (a, b) =>
      !!a &&
      !!b &&
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    const ordered = isRtl
      ? header.logo.left >= header.nav.right - 1 &&
        header.nav.left >= header.form.right - 1 &&
        header.form.left >= header.actions.right - 1
      : header.logo.right <= header.nav.left + 1 &&
        header.nav.right <= header.form.left + 1 &&
        header.form.right <= header.actions.left + 1;
    check(
      `${tag} header-nav-search-actions-clear`,
      ordered &&
        !overlap(header.logo, header.nav) &&
        !overlap(header.nav, header.form) &&
        !overlap(header.form, header.actions),
      `ordered=${ordered} navVisible=${!!header.nav} searchVisible=${!!header.form}`,
    );
  } else {
    check(
      `${tag} header-mobile-controls`,
      !header.nav && !header.form && !!header.searchToggle && !!header.menuToggle,
      `nav=${!!header.nav} searchForm=${!!header.form} searchToggle=${!!header.searchToggle} menu=${!!header.menuToggle}`,
    );
  }
  check(
    `${tag} header-account-at-sm`,
    viewport.width >= 640 ? !!header.account : !header.account,
    `account visible=${!!header.account} width=${viewport.width}`,
  );

  // 4. hero: two asymmetric tiles, no carousel, deal contained
  const hero = await page.evaluate(() => {
    const section = document.querySelector("main section");
    const grid = section.firstElementChild;
    const [campaign, promo] = grid.children;
    const rect = (node) => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const cRect = rect(campaign);
    const pRect = rect(promo);
    const image = campaign.querySelector("img");
    const iRect = image.getBoundingClientRect();
    const cta = promo.querySelector('a[href="#selection"]');
    const ctaRect = cta.getBoundingClientRect();
    const discount = promo.querySelectorAll("p")[1]?.querySelector("span");
    const promoStyle = getComputedStyle(promo);
    return {
      tiles: grid.children.length,
      carousel: !!section.querySelector('[aria-roledescription="carousel"]'),
      h1: section.querySelector("h1")?.innerText.trim() ?? "",
      campaignBg: getComputedStyle(campaign).backgroundColor,
      promoBg: getComputedStyle(promo).backgroundColor,
      campaign: cRect,
      promo: pRect,
      sideBySide:
        Math.abs(cRect.top - pRect.top) <= 1 &&
        (cRect.right <= pRect.left + 1 || pRect.right <= cRect.left + 1),
      equalHeight: Math.abs(cRect.height - pRect.height) <= 1,
      imageInside:
        iRect.top >= cRect.top - 1 &&
        iRect.bottom <= cRect.bottom + 1 &&
        iRect.left >= cRect.left - 1 &&
        iRect.right <= cRect.right + 1,
      ctaInside:
        ctaRect.top >= pRect.top - 1 &&
        ctaRect.bottom <= pRect.bottom + 1 &&
        ctaRect.left >= pRect.left - 1 &&
        ctaRect.right <= pRect.right + 1,
      ctaHeight: ctaRect.height,
      discount: discount?.textContent?.trim() ?? "",
      discountRect: discount ? rect(discount) : null,
      promoPadding: {
        left: parseFloat(promoStyle.paddingLeft),
        right: parseFloat(promoStyle.paddingRight),
      },
    };
  });
  check(
    `${tag} hero-two-tiles`,
    hero.tiles === 2 && hero.h1.length > 0 && !hero.carousel,
    `tiles=${hero.tiles} h1="${hero.h1}" carousel=${hero.carousel}`,
  );
  check(
    `${tag} hero-token-backgrounds`,
    hero.campaignBg === "rgb(241, 245, 249)" && hero.promoBg === "rgb(37, 99, 235)",
    `campaign=${hero.campaignBg} promo=${hero.promoBg}`,
  );
  check(
    `${tag} hero-media-and-cta-contained`,
    hero.imageInside && hero.ctaInside && hero.ctaHeight >= 36,
    `imageInside=${hero.imageInside} ctaInside=${hero.ctaInside} ctaH=${hero.ctaHeight}`,
  );
  check(
    `${tag} hero-layout`,
    viewport.width >= 1024
      ? hero.sideBySide && hero.equalHeight
      : hero.promo.top >= hero.campaign.bottom - 1,
    `sideBySide=${hero.sideBySide} equalHeight=${hero.equalHeight} promoTop=${hero.promo.top.toFixed(1)} campaignBottom=${hero.campaign.bottom.toFixed(1)}`,
  );
  check(
    `${tag} hero-deal-discount`,
    hero.discount.length > 0 && !!hero.discountRect,
    `discount="${hero.discount}"`,
  );

  // 5. cards: borderless, one image, icon-only quick add, no rating/full CTA
  const cardInfo = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#selection article")];
    const first = cards[0];
    const rect = (node) => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const media = first.querySelector(".aspect-square, .aspect-\\[5\\/4\\]") ?? first.querySelector("div.relative");
    const mediaRect = media.getBoundingClientRect();
    const title = first.querySelector("h3");
    const titleRect = title.getBoundingClientRect();
    const desc = title.nextElementSibling;
    const descRect = desc.getBoundingClientRect();
    const priceRow = desc.nextElementSibling;
    const priceRect = priceRow.getBoundingClientRect();
    const buttons = [...first.querySelectorAll("button")];
    const heart = buttons.find((b) => b.hasAttribute("aria-pressed"));
    const plus = buttons.at(-1);
    const articleStyle = getComputedStyle(first);
    const titleStyle = getComputedStyle(title);
    const heartRect = heart?.getBoundingClientRect();
    const image = first.querySelector("img");
    const imageRect = image.getBoundingClientRect();
    const dir = document.documentElement.dir;
    return {
      count: cards.length,
      articleBg: articleStyle.backgroundColor,
      border: parseFloat(articleStyle.borderTopWidth),
      radius: parseFloat(articleStyle.borderTopLeftRadius),
      mediaBg: getComputedStyle(media).backgroundColor,
      mediaRatio: mediaRect.height / mediaRect.width,
      mediaWidthRatio: mediaRect.width / first.getBoundingClientRect().width,
      mediaAboveTitle: mediaRect.bottom <= titleRect.top + 1,
      imageInset: imageRect.left - mediaRect.left,
      cardAspect: first.getBoundingClientRect().height / first.getBoundingClientRect().width,
      textAligned:
        document.documentElement.dir === "rtl"
          ? Math.abs(titleRect.right - mediaRect.right) <= 2
          : Math.abs(titleRect.left - mediaRect.left) <= 2,
      descGap: descRect.top - titleRect.bottom,
      priceGap: priceRect.top - descRect.bottom,
      desc: {
        text: (desc.innerText ?? "").trim(),
        color: getComputedStyle(desc).color,
        size: parseFloat(getComputedStyle(desc).fontSize),
        weight: getComputedStyle(desc).fontWeight,
        between:
          descRect.top >= titleRect.bottom - 1 &&
          descRect.bottom <= priceRect.top + 1,
      },
      priceWeight: getComputedStyle(priceRow.querySelector("span[dir='ltr']")).fontWeight,
      priceSize: parseFloat(getComputedStyle(priceRow.querySelector("span[dir='ltr']")).fontSize),
      lineClamp: titleStyle.webkitLineClamp,
      heart: heartRect
        ? {
            width: heartRect.width,
            height: heartRect.height,
            bg: getComputedStyle(heart).backgroundColor,
            topInset: heartRect.top - mediaRect.top,
            endInset:
              dir === "rtl"
                ? heartRect.left - mediaRect.left
                : mediaRect.right - heartRect.right,
            inside:
              heartRect.top >= mediaRect.top - 1 &&
              heartRect.bottom <= mediaRect.bottom + 1 &&
              heartRect.left >= mediaRect.left - 1 &&
              heartRect.right <= mediaRect.right + 1,
          }
        : null,
      plus: {
        ...rect(plus),
        radius: parseFloat(getComputedStyle(plus).borderTopLeftRadius),
        text: (plus.innerText ?? "").trim(),
        label: plus.getAttribute("aria-label") ?? "",
        bg: getComputedStyle(plus).backgroundColor,
      },
      fullWidthCtas: cards.filter((c) => {
        const b = [...c.querySelectorAll("button")].at(-1);
        return b.getBoundingClientRect().width / c.getBoundingClientRect().width > 0.6;
      }).length,
      buyNow: cards.some((c) => /Acheter maintenant|اشترِ الآن/i.test(c.textContent ?? "")),
      ratingNodes: document.querySelectorAll(
        "#selection [aria-label*='étoile'], #selection [aria-label*='تقييم'], #selection svg[aria-label*='star']",
      ).length,
      topTags: first.firstElementChild.querySelectorAll("span").length,
    };
  });
  check(
    `${tag} card-framed-image-first`,
    cardInfo.articleBg === "rgb(255, 255, 255)" &&
      cardInfo.border === 1 &&
      cardInfo.radius >= 8 &&
      cardInfo.mediaAboveTitle &&
      cardInfo.mediaWidthRatio >= 0.85 &&
      cardInfo.mediaWidthRatio <= 0.96 &&
      cardInfo.imageInset <= 1 &&
      cardInfo.textAligned,
    `bg=${cardInfo.articleBg} border=${cardInfo.border} radius=${cardInfo.radius} mediaAbove=${cardInfo.mediaAboveTitle} media/card=${cardInfo.mediaWidthRatio.toFixed(2)} imageInset=${cardInfo.imageInset} textAligned=${cardInfo.textAligned}`,
  );
  check(
    `${tag} card-reference-proportion`,
    viewport.width < 1024 || (cardInfo.cardAspect >= 1.10 && cardInfo.cardAspect <= 1.20),
    `card h/w=${cardInfo.cardAspect.toFixed(3)} (reference 1.15)`,
  );
  check(
    `${tag} card-reference-media`,
    Math.abs(cardInfo.mediaRatio - 0.715) <= 0.03 &&
      cardInfo.mediaBg === "rgb(255, 255, 255)",
    `ratio=${cardInfo.mediaRatio.toFixed(3)} (reference 0.716) mediaBg=${cardInfo.mediaBg}`,
  );
  check(
    `${tag} card-description-gray`,
    cardInfo.desc.text.length > 0 &&
      cardInfo.desc.color === "rgb(100, 116, 139)" &&
      cardInfo.desc.size === 12 &&
      cardInfo.desc.weight === "400" &&
      cardInfo.desc.between,
    `text="${cardInfo.desc.text}" color=${cardInfo.desc.color} size=${cardInfo.desc.size} weight=${cardInfo.desc.weight} between=${cardInfo.desc.between}`,
  );
  check(
    `${tag} card-title-desc-price-balance`,
    cardInfo.lineClamp === "1" &&
      cardInfo.descGap <= 6 &&
      cardInfo.priceGap <= 14 &&
      cardInfo.priceWeight === "600" &&
      cardInfo.priceSize >= 16,
    `lineClamp=${cardInfo.lineClamp} descGap=${cardInfo.descGap.toFixed(1)} priceGap=${cardInfo.priceGap.toFixed(1)} weight=${cardInfo.priceWeight} size=${cardInfo.priceSize}`,
  );
  check(
    `${tag} card-icon-only-cta`,
    cardInfo.plus.width <= 48 &&
      cardInfo.plus.height <= 48 &&
      cardInfo.plus.width >= 34 &&
      cardInfo.plus.radius >= 18 &&
      cardInfo.plus.text === "" &&
      cardInfo.plus.bg === "rgb(37, 99, 235)" &&
      /Ajouter|أضف/.test(cardInfo.plus.label) &&
      cardInfo.fullWidthCtas === 0 &&
      !cardInfo.buyNow,
    `plus=${cardInfo.plus.width}x${cardInfo.plus.height} r=${cardInfo.plus.radius} bg=${cardInfo.plus.bg} text="${cardInfo.plus.text}" label="${cardInfo.plus.label}" fullWidth=${cardInfo.fullWidthCtas} buyNow=${cardInfo.buyNow}`,
  );
  check(
    `${tag} card-heart-in-image`,
    !!cardInfo.heart &&
      cardInfo.heart.width >= 30 &&
      cardInfo.heart.inside &&
      Math.abs(cardInfo.heart.topInset - 8) <= 3 &&
      Math.abs(cardInfo.heart.endInset - 8) <= 3 &&
      cardInfo.heart.bg !== "rgba(0, 0, 0, 0)",
    `heart=${cardInfo.heart?.width}x${cardInfo.heart?.height} inside=${cardInfo.heart?.inside} topInset=${cardInfo.heart?.topInset.toFixed(1)} endInset=${cardInfo.heart?.endInset.toFixed(1)} bg=${cardInfo.heart?.bg}`,
  );
  check(
    `${tag} card-no-top-tags`,
    cardInfo.topTags === 0,
    `top tags inside image=${cardInfo.topTags}`,
  );
  check(
    `${tag} card-no-rating`,
    cardInfo.ratingNodes === 0,
    `rating nodes=${cardInfo.ratingNodes}`,
  );

  // 6. grid columns
  const cols = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#selection article")];
    return [...new Set(cards.map((c) => Math.round(c.getBoundingClientRect().left)))].length;
  });
  check(
    `${tag} product-grid-columns`,
    cols === expectedCols,
    `columns=${cols} expected=${expectedCols}`,
  );

  // 7. section header centered + filters
  const sectionHeader = await page.evaluate(() => {
    const h2 = document.querySelector("#selection h2");
    const rect = h2.getBoundingClientRect();
    return {
      center: rect.left + rect.width / 2,
      viewport: window.innerWidth / 2,
      bg: getComputedStyle(document.body).backgroundColor,
    };
  });
  check(
    `${tag} section-centered-white`,
    Math.abs(sectionHeader.center - sectionHeader.viewport) <= 3 &&
      sectionHeader.bg === "rgb(255, 255, 255)",
    `center=${sectionHeader.center.toFixed(1)} viewportCenter=${sectionHeader.viewport} bg=${sectionHeader.bg}`,
  );

  const chipGroup = page.locator('#selection [role="group"]').first();
  const chipCount = await chipGroup.locator("button").count();
  const activeChip = await chipGroup.locator('button[aria-pressed="true"]').evaluate((el) => ({
    text: el.innerText.trim(),
    bg: getComputedStyle(el).backgroundColor,
  }));
  check(
    `${tag} category-chips`,
    chipCount === 8 && activeChip.bg === "rgb(15, 23, 42)",
    `chips=${chipCount} active="${activeChip.text}" bg=${activeChip.bg}`,
  );

  await chipGroup.locator("button").nth(2).click();
  await page.waitForTimeout(200);
  const filtered = await page.evaluate(() => ({
    cards: document.querySelectorAll("#selection article").length,
    count: document.querySelector("#selection-count")?.innerText ?? "",
    resetVisible: [...document.querySelectorAll("#selection button")].some(
      (b) => /Réinitialiser|إعادة التعيين/.test(b.innerText) && b.getBoundingClientRect().width > 0,
    ),
  }));
  check(
    `${tag} category-filter-works`,
    filtered.cards === 1 && filtered.resetVisible && filtered.count.includes("1"),
    `cards=${filtered.cards} reset=${filtered.resetVisible} count="${filtered.count}"`,
  );

  const resetButton = page
    .locator("#selection button")
    .filter({ hasText: /Réinitialiser|إعادة التعيين/ })
    .first();
  await resetButton.click();
  await page.waitForTimeout(200);
  const restored = await page.evaluate(() => ({
    cards: document.querySelectorAll("#selection article").length,
    resetVisible: [...document.querySelectorAll("#selection button")].some(
      (b) => /Réinitialiser|إعادة التعيين/.test(b.innerText) && b.getBoundingClientRect().width > 0,
    ),
  }));
  check(
    `${tag} filter-reset-restores`,
    restored.cards === 12 && !restored.resetVisible,
    `cards=${restored.cards} reset=${restored.resetVisible}`,
  );

  // 8. custom sort: no native select, keyboard, ordering
  // The toolbar now holds three listboxes (price, rating, sort) — target the sort one.
  const nativeSelects = await page.locator("select").count();
  const sortTrigger = page
    .locator('#selection button[aria-haspopup="listbox"]')
    .filter({ hasText: /Trier|ترتيب/ });
  await sortTrigger.focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(200);
  const menuState = await page.evaluate(() => {
    const list = document.querySelector('#selection [role="listbox"]');
    if (!list) return { open: false };
    const rect = list.getBoundingClientRect();
    return {
      open: true,
      options: list.querySelectorAll('[role="option"]').length,
      focusedRole: document.activeElement?.getAttribute("role"),
      insideViewport:
        rect.left >= -1 &&
        rect.right <= window.innerWidth + 1,
    };
  });
  check(
    `${tag} sort-custom-keyboard`,
    nativeSelects === 0 &&
      menuState.open &&
      menuState.options === 3 &&
      menuState.focusedRole === "option" &&
      menuState.insideViewport,
    `selects=${nativeSelects} open=${menuState.open} options=${menuState.options} focus=${menuState.focusedRole} inViewport=${menuState.insideViewport}`,
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const ascending = await page.evaluate(() =>
    [...document.querySelectorAll("#selection article")].map((card) => {
      // Price is the first non-struck ltr span carrying the currency sign; the
      // rating value is also ltr, so it has to be skipped.
      const spans = [...card.querySelectorAll('span[dir="ltr"]')].filter(
        (s) => !/line-through/.test(s.className) && s.innerText.includes("€"),
      );
      return spans[0]?.innerText ?? "";
    }),
  );
  const nums = ascending.map(priceNumber);
  check(
    `${tag} sort-ascending-order`,
    nums.length > 1 && nums.every((n, i) => i === 0 || n >= nums[i - 1]),
    `prices=[${nums.join(",")}]`,
  );
  await page
    .locator("#selection button")
    .filter({ hasText: /Réinitialiser|إعادة التعيين/ })
    .first()
    .click();
  await page.waitForTimeout(200);

  // 9. live search from the header (desktop field / mobile panel)
  const term = locale === "fr" ? "aspirateur" : "مكنسة";
  if (viewport.width >= 1024) {
    const input = page.locator('header form[role="search"] input');
    await input.fill(term);
    await page.waitForTimeout(200);
    const searchState = await page.evaluate(() => ({
      cards: document.querySelectorAll("#selection article").length,
      count: document.querySelector("#selection-count")?.innerText ?? "",
      title: document.querySelector("#selection article h3")?.innerText ?? "",
    }));
    const searchTitleMatches = searchState.title.toLowerCase().includes(term.toLowerCase());
    check(
      `${tag} search-filters-grid`,
      searchState.cards === 1 && searchState.count.includes("1") && searchTitleMatches,
      `cards=${searchState.cards} count="${searchState.count}" title="${searchState.title}"`,
    );
    await input.press("Enter");
    await page.waitForTimeout(350);
    const scrolled = await page.evaluate(() => window.scrollY);
    check(`${tag} search-enter-scrolls`, scrolled > 100, `scrollY=${scrolled.toFixed(0)}`);
    await page.locator('header form[role="search"] button').click();
    await page.waitForTimeout(200);
    const cleared = await page.evaluate(() => ({
      cards: document.querySelectorAll("#selection article").length,
      value: document.querySelector('header form[role="search"] input').value,
    }));
    check(
      `${tag} search-clear`,
      cleared.cards === 12 && cleared.value === "",
      `cards=${cleared.cards} value="${cleared.value}"`,
    );

    await input.fill("zzz");
    await page.waitForTimeout(200);
    const empty = await page.evaluate(() => ({
      cards: document.querySelectorAll("#selection article").length,
      hasMessage: /Aucun produit|لا توجد/.test(document.querySelector("#selection").innerText),
    }));
    check(`${tag} search-empty-state`, empty.cards === 0 && empty.hasMessage, `cards=${empty.cards} message=${empty.hasMessage}`);
    await page
      .locator("#selection button")
      .filter({ hasText: /Réinitialiser|إعادة التعيين/ })
      .last()
      .click();
    await page.waitForTimeout(250);
    const emptied = await page.evaluate(() => ({
      cards: document.querySelectorAll("#selection article").length,
      value: document.querySelector('header form[role="search"] input').value,
    }));
    check(
      `${tag} search-empty-reset`,
      emptied.cards === 12 && emptied.value === "",
      `cards=${emptied.cards} value="${emptied.value}"`,
    );
  } else {
    await page.locator('header button[aria-controls="mobile-search"]').click();
    await page.waitForSelector("#mobile-search input");
    await page.waitForTimeout(150);
    const input = page.locator("#mobile-search input");
    const focused = await page.evaluate(
      () => document.activeElement === document.querySelector("#mobile-search input"),
    );
    await input.fill(term);
    await page.waitForTimeout(200);
    const searchState = await page.evaluate(() => ({
      cards: document.querySelectorAll("#selection article").length,
      count: document.querySelector("#selection-count")?.innerText ?? "",
    }));
    check(
      `${tag} mobile-search-filters-grid`,
      focused &&
        searchState.cards === 1 &&
        searchState.count.includes("1"),
      `focus=${focused} cards=${searchState.cards} count="${searchState.count}"`,
    );
    await input.press("Enter");
    await page.waitForTimeout(350);
    const afterSubmit = await page.evaluate(() => ({
      panel: !!document.querySelector("#mobile-search"),
      scroll: window.scrollY,
    }));
    check(
      `${tag} mobile-search-submit-closes`,
      !afterSubmit.panel && afterSubmit.scroll > 100,
      `panel=${afterSubmit.panel} scrollY=${afterSubmit.scroll.toFixed(0)}`,
    );
    await page
      .locator("#selection button")
      .filter({ hasText: /Réinitialiser|إعادة التعيين/ })
      .first()
      .click();
    await page.waitForTimeout(200);
    const restoredSearch = await page.evaluate(
      () => document.querySelectorAll("#selection article").length,
    );
    check(`${tag} mobile-search-reset`, restoredSearch === 12, `cards=${restoredSearch}`);
  }

  // 10. add to cart: icon feedback + header badge + revert
  const firstCard = page.locator("#selection article").first();
  const addButton = firstCard.locator("button").last();
  await addButton.click();
  await page.waitForTimeout(350);
  const addedState = await page.evaluate(() => {
    const card = document.querySelector("#selection article");
    const plus = [...card.querySelectorAll("button")].at(-1);
    const live = card.querySelector("span.sr-only");
    const badges = [...document.querySelectorAll("header span.bg-primary")].map((s) =>
      s.textContent.trim(),
    );
    return {
      bg: getComputedStyle(plus).backgroundColor,
      label: plus.getAttribute("aria-label"),
      live: live?.textContent?.trim() ?? "",
      badges,
    };
  });
  check(
    `${tag} add-to-cart-feedback`,
    (addedState.bg === "rgb(16, 185, 129)" ||
      addedState.bg === "rgb(16, 184, 128)") &&
      /Ajouté|تمت الإضافة/.test(addedState.label ?? "") &&
      /Ajouté|تمت الإضافة/.test(addedState.live) &&
      addedState.badges.includes("1"),
    `bg=${addedState.bg} label="${addedState.label}" live="${addedState.live}" badges=[${addedState.badges.join(",")}]`,
  );
  await page.waitForTimeout(1800);
  const reverted = await page.evaluate(() => {
    const plus = [...document.querySelectorAll("#selection article button")].at(-1);
    return { bg: getComputedStyle(plus).backgroundColor, label: plus.getAttribute("aria-label") };
  });
  check(
    `${tag} add-to-cart-reverts`,
    reverted.bg === "rgb(37, 99, 235)" && /Ajouter|أضف/.test(reverted.label ?? ""),
    `bg=${reverted.bg} label="${reverted.label}"`,
  );

  // 11. favorite toggle
  const heart = page.locator("#selection article button[aria-pressed]").first();
  await heart.click();
  const fav = await page.evaluate(() => {
    const button = document.querySelector("#selection article button[aria-pressed]");
    return {
      pressed: button.getAttribute("aria-pressed"),
      color: getComputedStyle(button.querySelector("svg")).color,
    };
  });
  check(
    `${tag} favorite-toggle`,
    fav.pressed === "true" && fav.color === "rgb(220, 38, 38)",
    `pressed=${fav.pressed} icon=${fav.color}`,
  );

  // 12. footer + newsletter
  const footer = await page.evaluate(() => {
    const el = document.querySelector("footer");
    return {
      bg: getComputedStyle(el).backgroundColor,
      navs: el.querySelectorAll("nav").length,
      socials: el.querySelectorAll("a[aria-label]").length,
      payments: el.querySelectorAll("span.rounded-md").length,
      newsletter: !!el.querySelector("#newsletter-email"),
    };
  });
  check(
    `${tag} footer-structure`,
    footer.bg === "rgb(15, 23, 42)" &&
      footer.navs === 4 &&
      footer.socials >= 3 &&
      footer.payments === 4 &&
      footer.newsletter,
    `bg=${footer.bg} navs=${footer.navs} socials=${footer.socials} payments=${footer.payments} form=${footer.newsletter}`,
  );
  await page.fill("#newsletter-email", "test@example.com");
  await page.locator('footer button[type="submit"]').click();
  await page.waitForTimeout(200);
  const thanks = await page.locator("footer [role='status']").count();
  check(`${tag} newsletter-submit`, thanks === 1, `status nodes=${thanks}`);

  // 13. contrast audit
  const pairs = await collectPairs(page);
  const contrastFails = [];
  for (const pair of pairs) {
    const fg = parseRgb(pair.fg);
    const bg = parseRgb(pair.resolvedBg);
    if (!fg || !bg) continue;
    const ratio = contrast(blend(fg, bg), bg);
    const large = pair.size >= 24 || (pair.size >= 18.66 && Number(pair.weight) >= 600);
    const required = large ? 3 : 4.5;
    if (ratio + 0.01 < required) {
      contrastFails.push(`${pair.name}=${ratio.toFixed(2)} (<${required})`);
    }
  }
  check(
    `${tag} contrast-audit`,
    contrastFails.length === 0,
    contrastFails.length ? contrastFails.join("; ") : `${pairs.length} pairs pass`,
  );

  // 14. RTL: Arabic not letter-spaced; promo/card values align to the start
  const rtlCheck = await page.evaluate(() => {
    const hero = document.querySelector("main section");
    const campaign = hero.firstElementChild.children[0];
    const promo = hero.firstElementChild.children[1];
    const eyebrow = campaign.querySelector("p");
    const promoRect = promo.getBoundingClientRect();
    const promoStyle = getComputedStyle(promo);
    const discount = promo.querySelectorAll("p")[1]?.querySelector("span");
    const dRect = discount.getBoundingClientRect();
    const card = document.querySelector("#selection article");
    const price = [...card.querySelectorAll('span[dir="ltr"]')].find(
      (s) => !/line-through/.test(s.className) && s.innerText.includes("€"),
    );
    const prRect = price.getBoundingClientRect();
    const cRect = card.getBoundingClientRect();
    const titleRect = card.querySelector("h3").getBoundingClientRect();
    return {
      spacing: getComputedStyle(eyebrow).letterSpacing,
      promo: {
        left: promoRect.left,
        right: promoRect.right,
        padLeft: parseFloat(promoStyle.paddingLeft),
        padRight: parseFloat(promoStyle.paddingRight),
      },
      discount: { left: dRect.left, right: dRect.right },
      card: { left: cRect.left, right: cRect.right },
      cardTitle: { left: titleRect.left, right: titleRect.right },
      price: { left: prRect.left, right: prRect.right },
    };
  });
  check(
    `${tag} rtl-letter-spacing`,
    isRtl ? rtlCheck.spacing === "normal" : parseFloat(rtlCheck.spacing) > 0,
    `letter-spacing=${rtlCheck.spacing}`,
  );
  const promoAligned = isRtl
    ? rtlCheck.promo.right - rtlCheck.discount.right <= rtlCheck.promo.padRight + 2 &&
      rtlCheck.promo.right - rtlCheck.discount.right >= -1
    : rtlCheck.discount.left - rtlCheck.promo.left <= rtlCheck.promo.padLeft + 2 &&
      rtlCheck.discount.left - rtlCheck.promo.left >= -1;
  check(
    `${tag} deal-aligned-to-start`,
    promoAligned,
    `discount=[${rtlCheck.discount.left.toFixed(1)},${rtlCheck.discount.right.toFixed(1)}] promo=[${rtlCheck.promo.left.toFixed(1)},${rtlCheck.promo.right.toFixed(1)}] rtl=${isRtl}`,
  );
  const priceAtStart = isRtl
    ? Math.abs(rtlCheck.cardTitle.right - rtlCheck.price.right) <= 2
    : Math.abs(rtlCheck.price.left - rtlCheck.cardTitle.left) <= 2;
  check(
    `${tag} card-price-aligned-to-start`,
    priceAtStart,
    `price=[${rtlCheck.price.left.toFixed(1)},${rtlCheck.price.right.toFixed(1)}] title=[${rtlCheck.cardTitle.left.toFixed(1)},${rtlCheck.cardTitle.right.toFixed(1)}] rtl=${isRtl}`,
  );

  // 15. mobile menu
  if (viewport.width < 1024) {
    const toggle = page.locator("header button[aria-expanded]").last();
    await toggle.click();
    await page.waitForTimeout(250);
    const mobileNav = await page.evaluate(() => {
      const links = [...document.querySelectorAll("header nav a")].filter(
        (a) => a.getBoundingClientRect().height > 0,
      );
      const toggles = [...document.querySelectorAll("header button[aria-expanded]")];
      return {
        links: links.length,
        expanded: toggles.at(-1)?.getAttribute("aria-expanded"),
        inViewport: links.every(
          (a) =>
            a.getBoundingClientRect().right <= window.innerWidth + 1 &&
            a.getBoundingClientRect().left >= -1,
        ),
      };
    });
    check(
      `${tag} mobile-menu-opens`,
      mobileNav.links === 2 && mobileNav.expanded === "true" && mobileNav.inViewport,
      `links=${mobileNav.links} expanded=${mobileNav.expanded} inViewport=${mobileNav.inViewport}`,
    );
    await toggle.click();
    await page.waitForTimeout(200);
    const closed = await toggle.getAttribute("aria-expanded");
    check(`${tag} mobile-menu-closes`, closed === "false", `expanded=${closed}`);
  }

  // 16. sticky header
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
  await page.waitForTimeout(250);
  const sticky = await page.evaluate(() =>
    document.querySelector("header").getBoundingClientRect().top,
  );
  check(`${tag} header-sticky`, Math.abs(sticky) <= 1, `top=${sticky}`);

  check(`${tag} no-console-errors`, errors.length === 0, errors.join(" | ") || "none");
  await page.close();

  // 17. language switch (fresh page)
  const langPage = await browser.newPage({ viewport, reducedMotion: "reduce" });
  await langPage.goto(`${BASE}/${locale}`, { waitUntil: "networkidle" });
  const trigger = langPage.locator('header button[aria-haspopup="listbox"]');
  await trigger.focus();
  await langPage.keyboard.press("ArrowDown");
  await langPage.waitForTimeout(200);
  const langMenu = await langPage.evaluate(() => {
    const list = document.querySelector('header [role="listbox"]');
    if (!list) return { open: false };
    const rect = list.getBoundingClientRect();
    return {
      open: true,
      options: list.querySelectorAll('[role="option"]').length,
      focused: document.activeElement?.getAttribute("role"),
      inViewport: rect.left >= -1 && rect.right <= window.innerWidth + 1,
    };
  });
  check(
    `${tag} lang-menu-keyboard`,
    langMenu.open && langMenu.options === 2 && langMenu.focused === "option" && langMenu.inViewport,
    `open=${langMenu.open} options=${langMenu.options} focus=${langMenu.focused} inViewport=${langMenu.inViewport}`,
  );
  await langPage.keyboard.press("Escape");
  await langPage.waitForTimeout(200);
  const escape = await langPage.evaluate(() => ({
    open: !!document.querySelector('header [role="listbox"]'),
    focused: document.activeElement?.getAttribute("aria-haspopup"),
  }));
  check(
    `${tag} lang-menu-escape`,
    !escape.open && escape.focused === "listbox",
    `open=${escape.open} focus=${escape.focused}`,
  );
  await trigger.click();
  await langPage.waitForTimeout(200);
  const options = langPage.locator('header [role="option"]');
  await options.nth(locale === "fr" ? 1 : 0).click();
  await langPage.waitForURL(`**/${locale === "fr" ? "ar" : "fr"}*`);
  const switched = await langPage.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
  }));
  check(
    `${tag} lang-switch-navigation`,
    switched.lang === (locale === "fr" ? "ar" : "fr") &&
      switched.dir === (locale === "fr" ? "rtl" : "ltr"),
    `lang=${switched.lang} dir=${switched.dir}`,
  );
  await langPage.close();
}

const browser = await chromium.launch();
for (const locale of ["fr", "ar"]) {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 900 },
    { width: 768, height: 900 },
    { width: 375, height: 812 },
    { width: 320, height: 760 },
  ]) {
    try {
      await runLocale(browser, locale, viewport);
    } catch (err) {
      failures.push(`FAIL ${locale}@${viewport.width} crashed — ${err.message}`);
    }
  }
}
await browser.close();

console.log(notes.join("\n"));
if (failures.length) {
  console.error(`\n${failures.length} FAILURE(S):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`\nAll ${notes.length} probes passed against ${BASE}.`);