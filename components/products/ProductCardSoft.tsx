"use client";

import { Check, Heart, Plus, ShoppingCart, Star } from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { pseudoRating, savingsOf, swatchesOf } from "./meta";
import { useCardCart } from "./useCardCart";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

const BADGE_CLASS = {
  best: "bg-ink text-white",
  new: "bg-brand text-white",
  promo: "bg-sale text-white",
} as const;

/**
 * Soft catalogue card for the redesigned surfaces. The home page keeps the
 * original square-cut card, so this is a sibling rather than a variant that
 * could drift back into the home section.
 */
export default function ProductCardSoft({
  product,
  title,
  price,
  oldPrice,
}: {
  product: Product;
  title: string;
  price: string;
  oldPrice?: string;
}) {
  const t = useTranslations("products");
  const locale = useLocale();
  const href = `/${locale}/product/${product.id}`;
  const { fav, added, inCart, addToCart, toggleFav } = useCardCart(product, title);
  const { rating, reviews } = pseudoRating(product);
  const savings = savingsOf(product);
  const swatches = swatchesOf(product);
  const badge = product.badge
    ? {
        cls: BADGE_CLASS[product.badge],
        label: t(
          `badge${product.badge[0].toUpperCase()}${product.badge.slice(1)}` as "badgeNew",
        ),
      }
    : null;

  return (
    <article
      data-testid="product-card"
      className="group flex h-full flex-col rounded-soft border border-hairline bg-white p-2 shadow-soft transition-[transform,border-color,box-shadow] duration-300 ease-out-quint hover:-translate-y-1 hover:border-brand/25 hover:shadow-pop motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[14px] bg-mist">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.05]"
          />
        </Link>

        {badge && (
          <span
            className={cn(
              "absolute start-2.5 top-2.5 max-w-[calc(100%-3.75rem)] truncate rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] shadow-sm sm:px-2.5 sm:tracking-[0.07em]",
              badge.cls,
            )}
          >
            <span className="sm:hidden">
              {product.badge === "best" ? t("badgeBestShort") : badge.label}
            </span>
            <span className="hidden sm:inline">{badge.label}</span>
          </span>
        )}

        <button
          type="button"
          onClick={toggleFav}
          aria-pressed={fav}
          aria-label={t("favorite")}
          className="absolute end-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-muted shadow-[0_2px_8px_rgba(16,24,40,0.12)] backdrop-blur transition-colors hover:text-sale before:absolute before:-inset-1.5 before:content-['']"
        >
          <Heart
            size={16}
            weight={fav ? "fill" : "regular"}
            aria-hidden="true"
            className={fav ? "text-sale" : undefined}
          />
        </button>

        {!product.inStock && (
          <span className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-ink/80 px-3 py-1.5 text-center text-[11px] font-semibold text-white backdrop-blur">
            {t("soldOut")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-mist px-2 py-0.5">
            <Star size={11} weight="fill" aria-hidden="true" className="text-ink" />
            <span dir="ltr" className="text-[11px] font-semibold num text-ink">
              {rating.toFixed(1)}
            </span>
          </span>
          <span className="truncate text-[11px] text-muted">
            {t("card.reviews", { count: reviews })}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-[14px] font-semibold leading-[1.4] tracking-[-0.01em] text-ink">
          <Link href={href} className="transition-colors hover:text-brand">
            {title}
          </Link>
        </h3>

        <div className="mt-auto flex flex-wrap items-end gap-x-2 gap-y-1 pt-3">
          <span dir="ltr" className="text-[17px] font-bold tracking-[-0.02em] num text-ink">
            {price}
          </span>
          {oldPrice && (
            <span dir="ltr" className="pb-0.5 text-[12px] num text-muted line-through">
              {oldPrice}
            </span>
          )}
          {savings !== null && (
            <span className="mb-0.5 rounded-full bg-sale/10 px-2 py-0.5 text-[10px] font-bold num text-sale">
              {t("card.save", { percent: savings })}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1" aria-hidden="true">
            {swatches.map((swatch, i) => (
              <span
                key={i}
                className={cn(
                  "h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-ink/10",
                  swatch,
                )}
              />
            ))}
            <span className="ms-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-hairline text-muted">
              <Plus size={9} weight="bold" />
            </span>
          </span>

          <button
            type="button"
            data-testid="card-add"
            onClick={addToCart}
            disabled={!product.inStock}
            aria-label={
              !product.inStock
                ? t("soldOut")
                : inCart
                  ? t("inCart")
                  : added
                    ? t("added")
                    : t("addToCart")
            }
            className={cn(
              "flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12.5px] font-semibold transition-all duration-200 sm:w-auto sm:px-3.5",
              !product.inStock
                ? "cursor-not-allowed bg-mist text-muted"
                : added || inCart
                  ? "bg-mint-soft text-mint-deep ring-1 ring-mint/25"
                  : "bg-brand text-white shadow-[0_10px_20px_-12px_rgba(47,107,255,0.9)] hover:bg-brand-deep",
            )}
          >
            {added || inCart ? (
              <Check size={14} weight="bold" aria-hidden="true" />
            ) : (
              <ShoppingCart size={14} weight="fill" aria-hidden="true" />
            )}
            <span>
              {product.inStock
                ? inCart
                  ? t("inCartShort")
                  : added
                    ? t("addedShort")
                    : t("addShort")
                : t("soldOutShort")}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}