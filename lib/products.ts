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
  /** Whole Algerian dinars. */
  price: number;
  oldPrice?: number;
  badge?: "best" | "new" | "promo";
  category: ProductCategory;
  inStock: boolean;
};

// ids are 1:1 with public/assets/products/<id>.jpg (see scripts/fetch-products.mjs)
export const products: Product[] = [
  { id: "p1", image: "/assets/products/p1.jpg", brand: "Vistar", price: 8900, oldPrice: 11900, badge: "promo", category: "cameras", inStock: true },
  { id: "p2", image: "/assets/products/p2.jpg", brand: "Vistar", price: 7900, badge: "best", category: "cameras", inStock: true },
  { id: "p3", image: "/assets/products/p3.jpg", brand: "Norddrive", price: 2500, badge: "new", category: "mounts", inStock: true },
  { id: "p4", image: "/assets/products/p4.jpg", brand: "Terraline", price: 4500, badge: "best", category: "storage", inStock: true },
  { id: "p5", image: "/assets/products/p5.jpg", brand: "Terraline", price: 3200, category: "storage", inStock: true },
  { id: "p6", image: "/assets/products/p6.jpg", brand: "Aeroform", price: 5900, oldPrice: 7400, badge: "promo", category: "cleaning", inStock: true },
  { id: "p7", image: "/assets/products/p7.jpg", brand: "Aeroform", price: 3900, badge: "new", category: "cleaning", inStock: true },
  { id: "p8", image: "/assets/products/p8.jpg", brand: "Lumo", price: 7900, category: "lighting", inStock: false },
  { id: "p9", image: "/assets/products/p9.jpg", brand: "Voltway", price: 12900, badge: "best", category: "power", inStock: true },
  { id: "p10", image: "/assets/products/p10.jpg", brand: "Voltway", price: 4900, category: "power", inStock: true },
  { id: "p11", image: "/assets/products/p11.jpg", brand: "Voltway", price: 6500, oldPrice: 8900, badge: "promo", category: "power", inStock: false },
  { id: "p12", image: "/assets/products/p12.jpg", brand: "Gridline", price: 2200, badge: "new", category: "interior", inStock: true },
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

// Price-band facet. Bounds follow the catalog's actual 2 200–12 900 DA spread,
// so every band matches at least one SKU.
export type PriceBand = "all" | "under5000" | "mid" | "high";

export const priceBandOf = (price: number, band: PriceBand) => {
  if (band === "all") return true;
  if (band === "under5000") return price < 5000;
  if (band === "mid") return price >= 5000 && price < 10000;
  return price >= 10000;
};

/* ------------------------------------------------------------------ *
 * Detail data. Every value below is mock catalogue content for a
 * storefront demo: the figures restate what the product title already
 * claims (1080P, 9000 Pa, H7 6000 K, 12 V 3000 A) rather than inventing
 * new engineering precision. Labels are i18n keys, values stay neutral.
 * ------------------------------------------------------------------ */

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
 * Pricing. Cash on delivery, free delivery — the total is the subtotal.
 * ------------------------------------------------------------------ */

export type Totals = {
  subtotal: number;
  total: number;
  itemCount: number;
};

export const totalsFor = (lines: { product: Product; qty: number }[]): Totals => {
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  return { subtotal, total: subtotal, itemCount };
};