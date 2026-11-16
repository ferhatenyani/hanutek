"use client";

import { useEffect, useRef, useState } from "react";
import { cartStore, useInCart } from "@/lib/cart-store";
import { favoritesStore, useIsFavorite } from "@/lib/favorites-store";
import type { Product } from "@/lib/products";

/** Custom event the header cart icon listens to for the fly-to-cart dot. */
export const FLY_EVENT = "hanutek:fly-to-cart";

export function flyToCart(from: HTMLElement) {
  const rect = from.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent(FLY_EVENT, {
      detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    }),
  );
}

/**
 * Card-level cart and favourite state. The transient "just added" pulse is kept
 * apart from `inCart`, which is the truth from the persisted cart.
 */
export function useCardCart(product: Product) {
  const fav = useIsFavorite(product.id);
  const inCart = useInCart(product.id);
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const addToCart = (source?: HTMLElement | null) => {
    cartStore.add(product.id, 1);
    if (source) flyToCart(source);
    setJustAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), 1600);
  };

  const toggleFav = () => favoritesStore.toggle(product.id);

  return { fav, inCart, justAdded, added: justAdded || inCart, addToCart, toggleFav };
}