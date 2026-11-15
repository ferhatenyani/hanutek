"use client";

import { Trash } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import QtyStepper from "@/components/ui/QtyStepper";
import { cartStore, type ResolvedLine } from "@/lib/cart-store";
import { COLORWAYS } from "@/lib/products";
import { toastStore } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

/**
 * Cart line as a soft, horizontal row: media, identity, quantity, price and a
 * quiet remove control. Out-of-stock lines keep their place with a visible
 * warning rather than disappearing from the order.
 */
export default function CartLineCard({ line }: { line: ResolvedLine }) {
  const t = useTranslations("cart");
  const tp = useTranslations("products");
  const tpr = useTranslations("product");
  const locale = useLocale();

  const { product, qty, colorway, lineTotal } = line;
  const format = new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  });
  const soldOut = !product.inStock;
  const title = tp(`items.${product.id}.title` as "items.p1.title");

  const remove = () => {
    cartStore.remove(line.key);
    toastStore.push({
      message: t("removedToast", { title }),
      tone: "neutral",
    });
  };

  return (
    <article data-testid="cart-line" className="flex gap-3.5 px-4 py-4 sm:gap-4 sm:px-5">
      <Link
        href={`/${locale}/product/${product.id}`}
        className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-soft-sm bg-mist ring-1 ring-inset ring-ink/[0.05] sm:h-[104px] sm:w-[104px]"
      >
        <Image src={product.image} alt={title} fill sizes="104px" className="object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted rtl:tracking-normal">
              {product.brand}
            </p>
            <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-[1.35] text-ink">
              <Link href={`/${locale}/product/${product.id}`} className="transition-colors hover:text-brand">
                {title}
              </Link>
            </h3>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn("h-3 w-3 rounded-full ring-1 ring-inset ring-ink/15", COLORWAYS[colorway])}
                />
                {t("colorway", {
                  color: tpr(`colors.${colorway}` as "colors.black"),
                })}
              </span>
              {soldOut && (
                <span className="rounded-full bg-sale/10 px-2 py-0.5 text-[10.5px] font-semibold text-sale">
                  {t("soldOutLine")}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={remove}
            aria-label={t("remove", { title })}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sale/8 hover:text-sale"
          >
            <Trash size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-3">
          <QtyStepper
            value={qty}
            onChange={(next) => cartStore.setQty(line.key, next)}
            size="sm"
            tone={soldOut ? "outline" : "solid"}
            disabled={soldOut}
            label={t("quantityFor", { title })}
          />

          <div className="text-end">
            <p dir="ltr" className="text-[16px] font-bold leading-none num text-ink">
              {format.format(lineTotal)}
            </p>
            <p dir="ltr" className="mt-1 text-[10.5px] num text-muted">
              {format.format(product.price)} · {t("eachQty", { qty })}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}