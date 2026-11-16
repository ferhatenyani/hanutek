import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Totals } from "./products";

export type OrderLine = {
  id: string;
  image: string;
  qty: number;
  unitPrice: number;
};

export type OrderStatus = "processing" | "shipped" | "delivered";

export type Order = {
  ref: string;
  placedAt: string;
  status: OrderStatus;
  name: string;
  phone: string;
  address: string;
  lines: OrderLine[];
  totals: Totals;
  payment: "cod";
};

type OrdersState = {
  orders: Order[];
  place: (order: Order) => void;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      place: (order) => set({ orders: [order, ...get().orders] }),
    }),
    {
      name: "hanutek:v2:orders",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ orders: s.orders }),
    },
  ),
);

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
  get: useOrdersStore.getState,
  subscribe: useOrdersStore.subscribe,
  place: (order: Order) => useOrdersStore.getState().place(order),
  find: (ref: string) => useOrdersStore.getState().orders.find((o) => o.ref === ref),
};

export function useOrders(): Order[] {
  return useOrdersStore((s) => s.orders);
}

export function useOrder(ref: string): Order | undefined {
  return useOrdersStore((s) => s.orders.find((o) => o.ref === ref));
}