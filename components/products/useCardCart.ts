"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cartStore, useInCart } from "@/lib/cart-store";
import { favoritesStore, useIsFavorite } from "@/lib/favorites-store";
import { defaultColorway, type Product } from "@/lib/products";
import { toastStore } from "@/lib/toast-store";

/**
 * Card-level cart and favourite state. The transient "just added" pulse is kept
 * apart from `inCart`, which is the truth from the persisted cart: a card stays
 * marked once its product is in the basket.
 */
export function useCardCart(product: Product, title: string) {
  const fav = useIsFavorite(product.id);
  const inCart = useInCart(product.id);
  const locale = useLocale();
  const tc = useTranslations("cart");
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const addToCart = () => {
    cartStore.add(product.id, 1, defaultColorway(product));
    setJustAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), 1800);
    toastStore.push({
      message: tc("addedToast", { qty: 1, title }),
      tone: "success",
      actionLabel: tc("viewCart"),
      href: `/${locale}/cart`,
    });
  };

  const toggleFav = () => favoritesStore.toggle(product.id);

  return { fav, inCart, justAdded, added: justAdded || inCart, addToCart, toggleFav };
}
