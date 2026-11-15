export type ProductCategory =
  | "cameras"
  | "mounts"
  | "storage"
  | "cleaning"
  | "lighting"
  | "power"
  | "interior";

export type Product = {
  id: string;
  image: string;
  brand: string;
  price: number;
  oldPrice?: number;
  badge?: "best" | "new" | "promo";
  category: ProductCategory;
  inStock: boolean;
};

// ids are 1:1 with public/assets/products/<id>.jpg (see scripts/fetch-products.mjs)
export const products: Product[] = [
  { id: "p1", image: "/assets/products/p1.jpg", brand: "Vistar", price: 89, oldPrice: 119, badge: "promo", category: "cameras", inStock: true },
  { id: "p2", image: "/assets/products/p2.jpg", brand: "Vistar", price: 79, badge: "best", category: "cameras", inStock: true },
  { id: "p3", image: "/assets/products/p3.jpg", brand: "Norddrive", price: 25, badge: "new", category: "mounts", inStock: true },
  { id: "p4", image: "/assets/products/p4.jpg", brand: "Terraline", price: 45, badge: "best", category: "storage", inStock: true },
  { id: "p5", image: "/assets/products/p5.jpg", brand: "Terraline", price: 32, category: "storage", inStock: true },
  { id: "p6", image: "/assets/products/p6.jpg", brand: "Aeroform", price: 59, oldPrice: 74, badge: "promo", category: "cleaning", inStock: true },
  { id: "p7", image: "/assets/products/p7.jpg", brand: "Aeroform", price: 39, badge: "new", category: "cleaning", inStock: true },
  { id: "p8", image: "/assets/products/p8.jpg", brand: "Lumo", price: 79, category: "lighting", inStock: false },
  { id: "p9", image: "/assets/products/p9.jpg", brand: "Voltway", price: 129, badge: "best", category: "power", inStock: true },
  { id: "p10", image: "/assets/products/p10.jpg", brand: "Voltway", price: 49, category: "power", inStock: true },
  { id: "p11", image: "/assets/products/p11.jpg", brand: "Voltway", price: 65, oldPrice: 89, badge: "promo", category: "power", inStock: false },
  { id: "p12", image: "/assets/products/p12.jpg", brand: "Gridline", price: 22, badge: "new", category: "interior", inStock: true },
];

export const categories: ProductCategory[] = [
  "cameras",
  "mounts",
  "storage",
  "cleaning",
  "lighting",
  "power",
  "interior",
];

export const productById = (id: string) => products.find((p) => p.id === id);

// Price-band facet. Bounds follow the catalog's actual 22–129 € spread, so every
// band matches at least one SKU.
export type PriceBand = "all" | "under50" | "mid" | "high";

export const priceBandOf = (price: number, band: PriceBand) => {
  if (band === "all") return true;
  if (band === "under50") return price < 50;
  if (band === "mid") return price >= 50 && price < 100;
  return price >= 100;
};

// Rating-floor facet. The seeded ratings occupy 4.0–4.8, so both floors land
// inside that range and each one removes something visible.
export type RatingFloor = "all" | "r42" | "r45";

export const ratingFloorValue: Record<Exclude<RatingFloor, "all">, number> = {
  r42: 4.2,
  r45: 4.5,
};

export const meetsRating = (rating: number, floor: RatingFloor) =>
  floor === "all" || rating >= ratingFloorValue[floor];

/* ------------------------------------------------------------------ *
 * Detail data. Every value below is mock catalogue content for a
 * storefront demo: the figures restate what the product title already
 * claims (1080P, 9000 Pa, H7 6000 K, 12 V 3000 A) rather than inventing
 * new engineering precision. Labels are i18n keys, values stay neutral.
 * ------------------------------------------------------------------ */

export type ColorwayKey = "black" | "grey" | "light" | "red";

export const COLORWAYS: Record<ColorwayKey, string> = {
  black: "bg-obsidian",
  grey: "bg-slate",
  light: "bg-line",
  red: "bg-sale",
};

const COLORWAY_ORDER: ColorwayKey[] = ["black", "grey", "light", "red"];

export const colorwaysOf = (product: Product): ColorwayKey[] => {
  const seed = Number(product.id.replace(/\D/g, "")) || 1;
  return COLORWAY_ORDER.slice(0, 2 + (seed % 3));
};

export const defaultColorway = (product: Product): ColorwayKey =>
  colorwaysOf(product)[0];

export type SpecRow = { labelKey: string; value: string };

const SPECS: Record<string, SpecRow[]> = {
  p1: [
    { labelKey: "resolution", value: "1080P" },
    { labelKey: "viewingAngle", value: "170°" },
    { labelKey: "protection", value: "IP68" },
    { labelKey: "voltage", value: "12 V" },
    { labelKey: "cableLength", value: "5 m" },
    { labelKey: "included", value: "4" },
  ],
  p2: [
    { labelKey: "resolution", value: "1080P" },
    { labelKey: "viewingAngle", value: "140°" },
    { labelKey: "screen", value: "4,3″" },
    { labelKey: "storage", value: "32 Go" },
    { labelKey: "voltage", value: "12 / 24 V" },
    { labelKey: "included", value: "3" },
  ],
  p3: [
    { labelKey: "deviceSize", value: "4,7–7,2″" },
    { labelKey: "mount", value: "Ventouse" },
    { labelKey: "rotation", value: "360°" },
    { labelKey: "material", value: "ABS + silicone" },
    { labelKey: "included", value: "2" },
  ],
  p4: [
    { labelKey: "capacity", value: "45 L" },
    { labelKey: "compartments", value: "3" },
    { labelKey: "material", value: "600D polyester" },
    { labelKey: "dimensions", value: "58 × 35 × 30 cm" },
    { labelKey: "foldable", value: "Oui" },
  ],
  p5: [
    { labelKey: "pockets", value: "6" },
    { labelKey: "material", value: "Oxford 600D" },
    { labelKey: "dimensions", value: "42 × 60 cm" },
    { labelKey: "mount", value: "Housse de siège" },
    { labelKey: "foldable", value: "Oui" },
  ],
  p6: [
    { labelKey: "suction", value: "9000 Pa" },
    { labelKey: "battery", value: "2 × 2000 mAh" },
    { labelKey: "runTime", value: "22 min" },
    { labelKey: "weight", value: "0,9 kg" },
    { labelKey: "included", value: "5" },
  ],
  p7: [
    { labelKey: "capacity", value: "1 L" },
    { labelKey: "nozzles", value: "5" },
    { labelKey: "connection", value: "Rapide 1/4″" },
    { labelKey: "material", value: "Laiton + PP" },
    { labelKey: "included", value: "6" },
  ],
  p8: [
    { labelKey: "socket", value: "H7" },
    { labelKey: "temperature", value: "6000 K" },
    { labelKey: "power", value: "55 W" },
    { labelKey: "lifespan", value: "30 000 h" },
    { labelKey: "included", value: "2" },
  ],
  p9: [
    { labelKey: "peakCurrent", value: "3000 A" },
    { labelKey: "capacity", value: "20 000 mAh" },
    { labelKey: "voltage", value: "12 V" },
    { labelKey: "power", value: "150 W" },
    { labelKey: "included", value: "4" },
  ],
  p10: [
    { labelKey: "maxPressure", value: "16 bar" },
    { labelKey: "accuracy", value: "0,1 bar" },
    { labelKey: "battery", value: "4000 mAh" },
    { labelKey: "nozzle", value: "3 embouts" },
    { labelKey: "screen", value: "Digital" },
  ],
  p11: [
    { labelKey: "protocols", value: "OBD2 / CAN" },
    { labelKey: "modes", value: "10 modes" },
    { labelKey: "batteryTest", value: "12 V" },
    { labelKey: "screen", value: "Écran couleur" },
    { labelKey: "included", value: "3" },
  ],
  p12: [
    { labelKey: "diameter", value: "38 cm" },
    { labelKey: "material", value: "Microfibre" },
    { labelKey: "grip", value: "Antidérapant" },
    { labelKey: "fit", value: "Universel" },
    { labelKey: "care", value: "Lavage 30°" },
  ],
};

export const specsOf = (product: Product): SpecRow[] => SPECS[product.id] ?? [];

/** Three selling points per SKU, ordered most to least decision-relevant. */
const HIGHLIGHTS: Record<string, string[]> = {
  p1: ["guidelines", "night", "install"],
  p2: ["mirror", "loop", "screen"],
  p3: ["suction", "rotation", "hands"],
  p4: ["foldable", "compartments", "trunk"],
  p5: ["pockets", "seats", "water"],
  p6: ["wireless", "power", "filters"],
  p7: ["foam", "nozzles", "rinse"],
  p8: ["beam", "plug", "canbus"],
  p9: ["start", "compressor", "safety"],
  p10: ["preset", "autoStop", "nozzle"],
  p11: ["codes", "battery", "live"],
  p12: ["grip", "stitch", "fit"],
};

export const highlightKeysOf = (product: Product): string[] =>
  HIGHLIGHTS[product.id] ?? [];

export const relatedOf = (product: Product, limit = 4): Product[] => {
  const sameCategory = products.filter(
    (p) => p.category === product.category && p.id !== product.id,
  );
  const others = products.filter(
    (p) => p.category !== product.category && p.inStock,
  );
  return [...sameCategory, ...others].slice(0, limit);
};

/* ------------------------------------------------------------------ *
 * Pricing. Mock rules, applied identically everywhere in the app.
 * ------------------------------------------------------------------ */

export type ShippingMethod = "standard" | "express" | "pickup";

export const SHIPPING: Record<
  ShippingMethod,
  { cost: number; freeFrom: number; days: number; etaKey: string }
> = {
  standard: { cost: 4.9, freeFrom: 60, days: 2, etaKey: "shipping.standard.eta" },
  express: { cost: 9.9, freeFrom: 150, days: 1, etaKey: "shipping.express.eta" },
  pickup: { cost: 0, freeFrom: 0, days: 0, etaKey: "shipping.pickup.eta" },
};

export type PromoCode = {
  code: string;
  kind: "percent" | "shipping";
  value: number;
  minSubtotal: number;
};

export const PROMOS: PromoCode[] = [
  { code: "HANU10", kind: "percent", value: 10, minSubtotal: 0 },
  { code: "GARAGE25", kind: "percent", value: 25, minSubtotal: 120 },
  { code: "PORTOFFERT", kind: "shipping", value: 100, minSubtotal: 40 },
];

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
  shippingWaived: boolean;
};

export const totalsFor = (
  lines: { product: Product; qty: number }[],
  shippingMethod: ShippingMethod = "standard",
  promoCode?: string | null,
): Totals => {
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  const promo = promoCode
    ? PROMOS.find((p) => p.code === promoCode.toUpperCase())
    : undefined;
  const promoApplies = !!promo && subtotal >= promo.minSubtotal && itemCount > 0;

  const discount =
    promoApplies && promo!.kind === "percent"
      ? Math.round(subtotal * promo!.value) / 100
      : 0;

  const rule = SHIPPING[shippingMethod];
  const net = subtotal - discount;
  const shippingWaived =
    itemCount === 0 || net >= rule.freeFrom || (promoApplies && promo!.kind === "shipping");
  const shipping = shippingWaived ? 0 : rule.cost;

  return {
    subtotal,
    discount,
    shipping,
    total: Math.max(0, net + shipping),
    itemCount,
    shippingWaived,
  };
};
