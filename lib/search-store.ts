import { create } from "zustand";

type SearchState = {
  query: string;
  setQuery: (next: string) => void;
  clear: () => void;
};

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
  clear: () => set({ query: "" }),
}));

export const searchStore = {
  getQuery: () => useSearchStore.getState().query,
  setQuery: (next: string) => useSearchStore.getState().setQuery(next),
  clear: () => useSearchStore.getState().clear(),
};

export function useSearchQuery() {
  return useSearchStore((s) => s.query);
}