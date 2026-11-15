import type { ColorwayKey } from "./products";
import type { Totals } from "./products";
import { createStore, useStore } from "./store";
import type { Address } from "./session-store";

export type OrderLine = {
  id: string;
  image: string;
  qty: number;
  colorway: ColorwayKey;
  unitPrice: number;
};

export type OrderStatus = "processing" | "shipped" | "delivered";

export type Order = {
  ref: string;
  placedAt: string;
  status: OrderStatus;
  email: string;
  lines: OrderLine[];
  totals: Totals;
  shippingMethod: string;
  address: Address;
  card: { brand: string; last4: string };
};

type OrdersState = { orders: Order[] };

const EMPTY: OrdersState = { orders: [] };
const store = createStore<OrdersState>(EMPTY, { persist: "orders" });

const BRANDS: { pattern: RegExp; brand: string }[] = [
  { pattern: /^4/, brand: "Visa" },
  { pattern: /^5/, brand: "Mastercard" },
  { pattern: /^3[47]/, brand: "American Express" },
];

export const cardBrandOf = (digits: string) =>
  BRANDS.find((entry) => entry.pattern.test(digits.replace(/\s/g, "")))?.brand ??
  "Carte";

/** Deterministic, readable reference: HT-<yy><MM><dd>-<3 digits>. */
export const orderRef = (date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${String(date.getFullYear()).slice(2)}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}`;
  const tail = String(Math.floor(100 + Math.random() * 900));
  return `HT-${stamp}-${tail}`;
};

export const ordersStore = {
  get: () => store.get(),
  subscribe: store.subscribe,

  place(order: Order) {
    store.set({ orders: [order, ...store.get().orders] });
  },

  find(ref: string) {
    return store.get().orders.find((o) => o.ref === ref);
  },
};

export function useOrders(): Order[] {
  return useStore(store).orders;
}

export function useOrder(ref: string): Order | undefined {
  return useOrders().find((o) => o.ref === ref);
}
