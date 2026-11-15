// Sources real product photography for the automotive catalog.
//
//   node scripts/fetch-products.mjs sheet [limit]  -> download candidates + write .qwen/tmp/cand/sheet.html
//   node scripts/fetch-products.mjs apply          -> copy the chosen shot per SKU into public/assets/products/
//
// Why Bing Images: the stock sites themselves are not scriptable from here —
// freepik.com and pexels.com return 403 / Cloudflare "Just a moment..." to curl,
// Node fetch and headless Chromium alike, and api.openverse.org times out. Bing's
// image results are served to plain curl and carry both the origin `mediaurl` and
// a fetchable `th.bing.com` copy (`cdnurl`), so URLs come from Bing and pixels come
// from the origin CDN when it is open (Pexels/Unsplash/Freepik), else from Bing.
// Candidates and the picks manifest live under .qwen/tmp/cand/ — never committed.
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// SKU -> search query + tokens the photo must plausibly depict.
export const SHOTS = [
  { id: "p1", query: "rear view backup camera car kit", tokens: ["rear", "backup", "camera", "reverse", "car"] },
  { id: "p2", query: "dash cam windshield recorder", tokens: ["dash", "cam", "windshield", "recorder", "car"] },
  { id: "p3", query: "car phone holder mount dashboard", tokens: ["phone", "holder", "mount", "dashboard", "car"] },
  { id: "p4", query: "car trunk organizer storage box", tokens: ["trunk", "organizer", "storage", "boot", "car"] },
  { id: "p5", query: "car back seat organizer pocket", tokens: ["seat", "organizer", "pocket", "back", "car"] },
  { id: "p6", query: "cordless car vacuum cleaner", tokens: ["vacuum", "cleaner", "cordless", "car"] },
  { id: "p7", query: "car wash foam cannon snow gun", tokens: ["foam", "cannon", "wash", "snow", "gun"] },
  { id: "p8", query: "led headlight bulb kit car", tokens: ["led", "headlight", "bulb", "kit", "car"] },
  { id: "p9", query: "jump starter power bank car battery", tokens: ["jump", "starter", "booster", "battery", "power"] },
  { id: "p10", query: "portable tire inflator air compressor gauge", tokens: ["tire", "inflator", "compressor", "air", "gauge", "tyre"] },
  { id: "p11", query: "obd2 scanner car diagnostic tool", tokens: ["obd", "scanner", "diagnostic", "tool", "car"] },
  { id: "p12", query: "steering wheel cover car interior", tokens: ["steering", "wheel", "cover", "interior", "car"] },
];

const CAND = ".qwen/tmp/cand";
const FINAL = "public/assets/products";
const PER_QUERY = 5;
const STOCK = /(images\.pexels\.com|\bunsplash\.com|img\.freepik\.com|images\.freepik\.com|cdn\.pixabay\.com|images\.pikwizard\.com)/i;

function curl(url, { text = false } = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      "curl.exe",
      ["-sSfL", "--max-time", "60", "-A", UA, "-H", "Accept-Language: en-US,en;q=0.9", url],
      { maxBuffer: 64 * 1024 * 1024, encoding: text ? "utf8" : "buffer" },
      (err, out, stderr) =>
        err ? reject(new Error(`${String(stderr || err.message).trim()} — ${url}`)) : resolve(out),
    );
  });
}

const hostOf = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "?";
  }
};
const param = (blob, key) => {
  const hit = blob.match(new RegExp(`${key}=([^&"]+)`));
  if (!hit) return "";
  try {
    return decodeURIComponent(hit[1]);
  } catch {
    return hit[1];
  }
};

// Each result <a> carries href="/images/search?view=detailV2&…mediaurl=…&cdnurl=…&expw=&exph="
// plus an m="{…}" blob whose "t" key holds the result title.
function results(html) {
  const out = [];
  for (const tag of html.match(/<a[^>]*view=detailV2[^>]*>/g) || []) {
    const mediaurl = param(tag, "mediaurl");
    const cdnurl = param(tag, "cdnurl");
    if (!/^https?:/.test(mediaurl) || !cdnurl) continue;
    const title = (tag.match(/&quot;t&quot;:&quot;([\s\S]*?)&quot;,&quot;/) || [])[1] ?? "";
    out.push({
      mediaurl,
      cdnurl,
      w: Number(param(tag, "expw") || 0),
      h: Number(param(tag, "exph") || 0),
      alt: title
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))),
    });
  }
  return out;
}

function rank(list, tokens, query) {
  const qTokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return list
    .map((r) => {
      const hay = `${r.alt} ${r.mediaurl}`.toLowerCase();
      // Marketplace titles are keyword-stuffed, so an alt-text match is a strong
      // topicality signal — require at least one and drop everything else.
      const hits = tokens.filter((t) => r.alt.toLowerCase().includes(t)).length;
      const qHits = qTokens.filter((t) => hay.includes(t)).length;
      const stock = STOCK.test(r.mediaurl) ? 3 : 0;
      const size = r.w >= 700 && r.w <= 1600 ? 2 : r.w >= 450 ? 0 : -2;
      return { ...r, hits, score: hits * 3 + qHits + stock + size };
    })
    .filter((r) => r.hits >= 1 && r.w >= 450)
    .sort((a, b) => b.score - a.score);
}

// th.bing.com copies 404 for "R." ids once size params are appended, and most
// marketplace CDNs ignore imgix-style params, so pixels come from the origin URL
// as Bing recorded it.
async function download(origin, size) {
  if (STOCK.test(origin.mediaurl)) {
    try {
      return await curl(
        `${origin.mediaurl.split("?")[0]}?auto=compress&cs=tinysrgb&w=${size}&h=${size}&fit=crop`,
      );
    } catch {
      /* fall through */
    }
  }
  try {
    return await curl(origin.mediaurl);
  } catch {
    return curl(origin.cdnurl);
  }
}

async function sheet(limit) {
  await mkdir(CAND, { recursive: true });
  const rows = [];
  for (const shot of SHOTS.slice(0, limit)) {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(shot.query)}&form=IRFLTR`;
    const html = await curl(url, { text: true });
    const all = results(html);
    if (!all.length)
      throw new Error(`no results parsed for "${shot.query}" (mediaurl hits: ${(html.match(/mediaurl/g) || []).length}) — Bing markup changed?`);
    const top = rank(all, shot.tokens, shot.query).slice(0, PER_QUERY);
    const cells = [];
    for (let i = 0; i < top.length; i++) {
      try {
        const file = path.posix.join(CAND, `${shot.id}-${i}.jpg`);
        await writeFile(file, await download(top[i], 360));
        cells.push({ i, alt: top[i].alt, src: `${shot.id}-${i}.jpg`, mediaurl: top[i].mediaurl, cdnurl: top[i].cdnurl, w: top[i].w });
      } catch (error) {
        console.log(`  ! ${shot.id}[${i}] ${error.message}`);
      }
    }
    rows.push({ ...shot, cells });
    console.log(
      `${shot.id} parsed=${all.length} kept=${cells.length} | ${top
        .map((c) => hostOf(c.mediaurl))
        .join(" ")}`,
    );
  }
  await writeFile(`${CAND}/sheet.json`, JSON.stringify(rows, null, 2));
  await writeFile(
    `${CAND}/sheet.html`,
    `<!doctype html><meta charset="utf-8"><style>
body{font:13px/1.4 system-ui;margin:14px;background:#fff;color:#0f172a}
.row{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #e2e8f0}
.lab{width:150px;flex:0 0 150px}
.lab b{display:block;font-size:13px}.lab span{color:#64748b;font-size:10px}
.cell{width:120px;flex:0 0 120px}
.cell img{width:120px;height:120px;object-fit:cover;border:1px solid #cbd5e1;border-radius:3px;display:block;background:#f1f5f9}
.cell div{font-size:9px;color:#475569;margin-top:2px;height:24px;overflow:hidden}
</style><h3>Picking product shots — one index per SKU</h3>
${rows
  .map(
    (r) => `<div class="row"><div class="lab"><b>${r.id}</b><span>${r.query}</span></div>${r.cells
      .map(
        (c) => `<div class="cell"><img src="${c.src}"><div>[${c.i}] ${(c.alt || "").replace(/</g, "&lt;").slice(0, 60)}</div></div>`,
      )
      .join("")}</div>`,
  )
  .join("")}`,
  );
  console.log(`\nsheet: ${CAND}/sheet.html`);
}

async function apply() {
  const picks = JSON.parse(await readFile(`${CAND}/picks.json`, "utf8"));
  const rows = JSON.parse(await readFile(`${CAND}/sheet.json`, "utf8"));
  await mkdir(FINAL, { recursive: true });
  for (const [id, index] of Object.entries(picks)) {
    const row = rows.find((r) => r.id === id);
    const cell = row?.cells[Number(index)];
    if (!cell) throw new Error(`no candidate ${id}[${index}]`);
    const file = path.posix.join(FINAL, `${id}.jpg`);
    await writeFile(file, await download(cell, 900));
    console.log(`${file}  ${hostOf(cell.mediaurl)}  ${(cell.alt || "").slice(0, 50)}`);
  }
}

const mode = process.argv[2] ?? "sheet";
if (mode === "sheet") await sheet(Number(process.argv[3] ?? SHOTS.length));
else if (mode === "apply") await apply();
else console.log("usage: node scripts/fetch-products.mjs [sheet [n]|apply]");
