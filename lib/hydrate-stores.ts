import { useCartStore } from "./cart-store";
import { useCheckoutStore } from "./checkout-store";
import { useFavoritesStore } from "./favorites-store";
import { useOrdersStore } from "./orders-store";
import { useSessionStore } from "./session-store";

/**
 * Persisted stores skip hydration at module load so server markup and the
 * first client paint agree; this runs once post-mount to restore real state.
 */
export function hydrateStores() {
  useCartStore.persist.rehydrate();
  useFavoritesStore.persist.rehydrate();
  useSessionStore.persist.rehydrate();
  useCheckoutStore.persist.rehydrate();
  useOrdersStore.persist.rehydrate();
}