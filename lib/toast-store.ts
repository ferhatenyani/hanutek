import { createStore, useStore } from "./store";

export type Toast = {
  id: number;
  message: string;
  tone: "neutral" | "success" | "alert";
  href?: string;
  actionLabel?: string;
};

type ToastState = { toasts: Toast[] };

const EMPTY: ToastState = { toasts: [] };
const store = createStore<ToastState>(EMPTY);

let seq = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const clear = (id: number) => {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
};

export const toastStore = {
  get: () => store.get(),

  push(toast: Omit<Toast, "id">, ttl = 5000) {
    const id = ++seq;
    const next = [...store.get().toasts, { ...toast, id }].slice(-3);
    store.set({ toasts: next });
    clear(id);
    timers.set(
      id,
      setTimeout(() => toastStore.dismiss(id), ttl),
    );
    return id;
  },

  dismiss(id: number) {
    clear(id);
    store.set({ toasts: store.get().toasts.filter((t) => t.id !== id) });
  },
};

export function useToasts(): Toast[] {
  return useStore(store).toasts;
}
