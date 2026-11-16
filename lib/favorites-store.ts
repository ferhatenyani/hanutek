import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { productById } from "./products";

type FavoritesState = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle(id) {
        const { ids } = get();
        set({ ids: ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids] });
      },
      remove(id) {
        set({ ids: get().ids.filter((x) => x !== id) });
      },
      clear() {
        set({ ids: [] });
      },
    }),
    {
      name: "hanutek:v2:favorites",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ ids: s.ids }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FavoritesState>;
        return { ...current, ids: (p.ids ?? []).filter((id) => !!productById(id)) };
      },
    },
  ),
);

export const favoritesStore = {
  get: useFavoritesStore.getState,
  subscribe: useFavoritesStore.subscribe,
  toggle: (id: string) => useFavoritesStore.getState().toggle(id),
  remove: (id: string) => useFavoritesStore.getState().remove(id),
  clear: () => useFavoritesStore.getState().clear(),
};

export function useFavorites(): string[] {
  return useFavoritesStore((s) => s.ids);
}

export function useIsFavorite(id: string): boolean {
  return useFavoritesStore((s) => s.ids.includes(id));
}