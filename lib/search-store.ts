import { useSyncExternalStore } from "react";

type Listener = () => void;

let query = "";
const listeners = new Set<Listener>();

export const searchStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getQuery: () => query,
  setQuery: (next: string) => {
    if (next === query) return;
    query = next;
    listeners.forEach((listener) => listener());
  },
  clear: () => searchStore.setQuery(""),
};

export function useSearchQuery() {
  return useSyncExternalStore(
    searchStore.subscribe,
    searchStore.getQuery,
    () => "",
  );
}