import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { productById, totalsFor, type Product, type Totals } from "./products";

export type CartLine = {
  /** Product id — one line per SKU. */
  key: string;
  id: string;
  qty: number;
};

export type ResolvedLine = CartLine & { product: Product; lineTotal: number };

type CartState = {
  lines: CartLine[];
  /** Persisted: the first-ever add gets the page-blur spotlight. */
  hasAdded: boolean;
  /** Transient: bumped on every add so the header icon can react. */
  pulse: number;
  spotlight: boolean;
  add: (id: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  endSpotlight: () => void;
};

const MAX_QTY = 9;
const clampQty = (qty: number) =>
  Math.max(1, Math.min(MAX_QTY, Math.round(qty) || 1));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      hasAdded: false,
      pulse: 0,
      spotlight: false,

      add(id, qty = 1) {
        const product = productById(id);
        if (!product || !product.inStock) return;
        const { lines, hasAdded } = get();
        const existing = lines.find((l) => l.key === id);
        const next = existing
          ? lines.map((l) => (l.key === id ? { ...l, qty: clampQty(l.qty + qty) } : l))
          : [...lines, { key: id, id, qty: clampQty(qty) }];
        set({
          lines: next,
          hasAdded: true,
          pulse: get().pulse + 1,
          spotlight: !hasAdded,
        });
      },

      setQty(key, qty) {
        if (qty <= 0) return get().remove(key);
        set({
          lines: get().lines.map((l) => (l.key === key ? { ...l, qty: clampQty(qty) } : l)),
        });
      },

      remove(key) {
        set({ lines: get().lines.filter((l) => l.key !== key) });
      },

      clear() {
        set({ lines: [] });
      },

      endSpotlight() {
        set({ spotlight: false });
      },
    }),
    {
      name: "hanutek:v2:cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines, hasAdded: s.hasAdded }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        const lines = (p.lines ?? []).filter((l) => !!productById(l.id));
        return { ...current, lines, hasAdded: !!p.hasAdded };
      },
    },
  ),
);

/** Stable imperative facade for non-React callers. */
export const cartStore = {
  get: useCartStore.getState,
  subscribe: useCartStore.subscribe,
  add: (id: string, qty?: number) => useCartStore.getState().add(id, qty),
  setQty: (key: string, qty: number) => useCartStore.getState().setQty(key, qty),
  remove: (key: string) => useCartStore.getState().remove(key),
  clear: () => useCartStore.getState().clear(),
  snapshot: () => ({ lines: useCartStore.getState().lines }),
};

export const resolveLines = (lines: CartLine[]): ResolvedLine[] =>
  lines.flatMap((line) => {
    const product = productById(line.id);
    if (!product) return [];
    return [{ ...line, product, lineTotal: product.price * line.qty }];
  });

export const cartTotals = (state: { lines: CartLine[] }): Totals =>
  totalsFor(resolveLines(state.lines));

export function useCart() {
  return useCartStore();
}

export function useCartLines(): ResolvedLine[] {
  return resolveLines(useCartStore((s) => s.lines));
}

export function useCartCount(): number {
  return useCartStore((s) => s.lines.reduce((sum, l) => sum + l.qty, 0));
}

export function useInCart(id: string): boolean {
  return useCartStore((s) => s.lines.some((l) => l.id === id));
}