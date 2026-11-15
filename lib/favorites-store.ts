import { productById } from "./products";
import { createStore, useStore } from "./store";

type FavoritesState = { ids: string[] };

const EMPTY: FavoritesState = { ids: [] };
const store = createStore<FavoritesState>(EMPTY, { persist: "favorites" });

// A favourite whose product left the catalogue must not render an empty card.
const sanitize = (state: FavoritesState): FavoritesState => {
  const ids = state.ids.filter((id) => !!productById(id));
  return ids.length === state.ids.length ? state : { ids };
};

store.set(sanitize(store.get()));

export const favoritesStore = {
  get: () => store.get(),
  set: store.set,
  subscribe: store.subscribe,

  toggle(id: string) {
    const { ids } = store.get();
    store.set({
      ids: ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids],
    });
  },
  remove(id: string) {
    store.set({ ids: store.get().ids.filter((x) => x !== id) });
  },
  clear() {
    store.set(EMPTY);
  },
};

export function useFavorites(): string[] {
  return useStore(store).ids;
}

export function useIsFavorite(id: string): boolean {
  return useStore(store).ids.includes(id);
}
