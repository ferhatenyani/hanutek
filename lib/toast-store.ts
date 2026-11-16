import { create } from "zustand";

export type Toast = {
  id: number;
  message: string;
  tone: "neutral" | "success" | "alert";
  href?: string;
  actionLabel?: string;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">, ttl?: number) => number;
  dismiss: (id: number) => void;
};

let seq = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const clear = (id: number) => {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push(toast, ttl = 5000) {
    const id = ++seq;
    set({ toasts: [...get().toasts, { ...toast, id }].slice(-3) });
    clear(id);
    timers.set(
      id,
      setTimeout(() => get().dismiss(id), ttl),
    );
    return id;
  },

  dismiss(id) {
    clear(id);
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export const toastStore = {
  get: useToastStore.getState,
  push: (toast: Omit<Toast, "id">, ttl?: number) => useToastStore.getState().push(toast, ttl),
  dismiss: (id: number) => useToastStore.getState().dismiss(id),
};

export function useToasts(): Toast[] {
  return useToastStore((s) => s.toasts);
}