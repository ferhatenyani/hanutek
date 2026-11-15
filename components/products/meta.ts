import {
  COLORWAYS,
  colorwaysOf,
  type ColorwayKey,
  type Product,
  type ProductCategory,
} from "@/lib/products";

// Deterministic stand-ins until real variant/rating data exists.
const seedOf = (product: Product) =>
  Number(product.id.replace(/\D/g, "")) || 1;

export const skuOf = (product: Product) =>
  `${product.brand.slice(0, 3).toUpperCase()}-${product.id.toUpperCase()}`;

export const pseudoRating = (product: Product) => {
  const seed = seedOf(product);
  return {
    rating: Math.round((4 + ((seed * 7) % 9) / 10) * 10) / 10,
    reviews: 18 + ((seed * 53) % 340),
  };
};

export const savingsOf = (product: Product) =>
  product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

// Accessory colorways: obsidian, graphite, light grey, accent-stitch red.
// The keys and their count live in lib/products so the cart line, the detail
// page and this card can never disagree about what variants exist.
export const swatchClass = (colorway: ColorwayKey) => COLORWAYS[colorway];

export const swatchesOf = (product: Product) =>
  colorwaysOf(product).map(swatchClass);

export const colorwaysFor = (product: Product) => colorwaysOf(product);

export const TINT: Record<ProductCategory, string> = {
  cameras: "bg-canvas",
  mounts: "bg-well",
  storage: "bg-canvas",
  cleaning: "bg-well",
  lighting: "bg-canvas",
  power: "bg-well",
  interior: "bg-canvas",
};
