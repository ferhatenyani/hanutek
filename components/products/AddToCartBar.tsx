"use client";

import { Button } from "@/components/ui/Button";
import QtyStepper from "@/components/ui/QtyStepper";
import { Check, ShoppingCart } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cartStore } from "@/lib/cart-store";
import { toastStore } from "@/lib/toast-store";
import type { ColorwayKey, Product } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * The buy action, shared by the sheet footer and the standalone product page so
 * "add to cart" behaves identically everywhere: it writes the line, confirms
 * with a toast and offers the cart. Out of stock disables it rather than
 * hiding it, because the reason has to stay visible.
 */
export default function AddToCartBar({
  product,
  colorway,
  qty,
  title,
  onQty,
  variant = "sheet",
}: {
  product: Product;
  colorway: ColorwayKey;
  qty: number;
  title: string;
  onQty: (next: number) => void;
  variant?: "sheet" | "page";
}) {
  const t = useTranslations("product");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const [just, setJust] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const format = new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  const add = () => {
    cartStore.add(product.id, qty, colorway);
    setJust(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJust(false), 1800);
    toastStore.push({
      message: tc("addedToast", { qty, title }),
      tone: "success",
      actionLabel: tc("viewCart"),
      href: `/${locale}/cart`,
    });
  };

  return (
    <div
      data-testid="buy-bar"
      className={cn(
        "flex items-center gap-3",
        variant === "sheet" && "px-4 py-3 sm:px-5",
        variant === "page" &&
          "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-30 rounded-soft border border-hairline bg-white/95 p-3 shadow-pop backdrop-blur-xl lg:static lg:inset-auto lg:bottom-auto lg:z-auto lg:mt-6 lg:rounded-soft lg:bg-white lg:p-3.5 lg:shadow-soft",
      )}
    >
      <div className="flex min-w-0 shrink-0 flex-col">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted rtl:tracking-normal">
          {t("totalLabel")}
        </span>
        <span dir="ltr" className="text-[20px] font-bold leading-tight num text-ink">
          {format.format(product.price * qty)}
        </span>
      </div>

      <QtyStepper value={qty} onChange={onQty} className="ms-auto shrink-0" />

      <Button
        onClick={add}
        disabled={!product.inStock}
        shape="pill"
        size="xl"
        leading={
          just ? (
            <Check size={17} weight="bold" aria-hidden="true" />
          ) : (
            <ShoppingCart size={17} weight="fill" aria-hidden="true" />
          )
        }
        className={cn(
          "flex-1 sm:ms-0",
          variant === "page" && "sm:flex-1",
          just && "bg-mint-soft text-mint-deep shadow-none ring-1 ring-mint/30 hover:bg-mint-soft",
        )}
      >
        {product.inStock ? (just ? tc("added") : tc("addToCart")) : tc("unavailable")}
      </Button>
    </div>
  );
}