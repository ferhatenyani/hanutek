import type { Product } from "@/lib/products";

export const skuOf = (product: Product) =>
  `${product.brand.slice(0, 3).toUpperCase()}-${product.id.toUpperCase()}`;

export const savingsOf = (product: Product) =>
  product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;