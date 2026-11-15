import {
  colorwaysOf,
  defaultColorway,
  productById,
  totalsFor,
  type ColorwayKey,
  type Product,
  type Totals,
} from "./products";
import { createStore, useStore } from "./store";

export type CartLine = {
  /** Product id + colourway, so the same SKU in two colours stays two lines. */
  key: string;
  id: string;
  qty: number;
  colorway: ColorwayKey;
};

export type ResolvedLine = CartLine & { product: Product; lineTotal: number };

type CartState = { lines: CartLine[] };

const EMPTY: CartState = { lines: [] };
const MAX_QTY = 9;

const store = createStore<CartState>(EMPTY, { persist: "cart" });

const lineKey = (id: string, colorway: ColorwayKey) => `${id}:${colorway}`;

const clampQty = (qty: number) =>
  Math.max(1, Math.min(MAX_QTY, Math.round(qty) || 1));

/** Drops ids that no longer exist in the catalogue (stale localStorage). */
const sanitize = (state: CartState): CartState => {
  const lines = state.lines.filter((l) => {
    const product = productById(l.id);
    return !!product && colorwaysOf(product).includes(l.colorway);
  });
  return lines.length === state.lines.length ? state : { lines };
};

// Normalising once at module load keeps `getSnapshot` referentially stable,
// which useSyncExternalStore requires to avoid render loops.
store.set(sanitize(store.get()));

const current = () => store.get();

export const cartStore = {
  subscribe: store.subscribe,
  getServer: store.getServer,
  get: current,

  add(id: string, qty = 1, colorway?: ColorwayKey) {
    const product = productById(id);
    if (!product || !product.inStock) return;
    const variant =
      colorway && colorwaysOf(product).includes(colorway)
        ? colorway
        : defaultColorway(product);
    const key = lineKey(id, variant);
    const { lines } = current();
    const existing = lines.find((l) => l.key === key);
    const next = existing
      ? lines.map((l) =>
          l.key === key ? { ...l, qty: clampQty(l.qty + qty) } : l,
        )
      : [...lines, { key, id, qty: clampQty(qty), colorway: variant }];
    store.set({ lines: next });
  },

  setQty(key: string, qty: number) {
    const { lines } = current();
    if (qty <= 0) return cartStore.remove(key);
    store.set({
      lines: lines.map((l) => (l.key === key ? { ...l, qty: clampQty(qty) } : l)),
    });
  },

  remove(key: string) {
    store.set({ lines: current().lines.filter((l) => l.key !== key) });
  },

  clear() {
    store.set(EMPTY);
  },

  /** Used when an order is placed: keeps the colourway history on the order. */
  snapshot: current,
};

export const resolveLines = (lines: CartLine[]): ResolvedLine[] =>
  lines.flatMap((line) => {
    const product = productById(line.id);
    if (!product) return [];
    return [{ ...line, product, lineTotal: product.price * line.qty }];
  });

export const cartTotals = (
  state: CartState,
  shippingMethod: Parameters<typeof totalsFor>[1] = "standard",
  promoCode?: string | null,
): Totals => totalsFor(resolveLines(state.lines), shippingMethod, promoCode);

export function useCart(): CartState {
  return useStore(store);
}

export function useCartLines(): ResolvedLine[] {
  return resolveLines(useCart().lines);
}

export function useCartCount(): number {
  return useCart().lines.reduce((sum, l) => sum + l.qty, 0);
}

export function useInCart(id: string): boolean {
  return useCart().lines.some((l) => l.id === id);
}
