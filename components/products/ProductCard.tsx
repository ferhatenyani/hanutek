"use client";

import { Check, Heart, ShoppingCart, Star } from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { pseudoRating, savingsOf, swatchesOf } from "./meta";
import { useCardCart } from "./useCardCart";
import type { Product } from "@/lib/products";

const BADGE_CLASS = {
  best: "bg-obsidian text-white",
  new: "bg-primary text-white",
  promo: "bg-sale text-white",
} as const;

// Production product card for automotive accessories. Square-cut shape language:
// 4px card radius, full-bleed media with no outer margin, 3px CTA. Essential
// attributes only (title, rating, variants, price, one CTA); calm lift on hover.
// The card sits on a white section, so separation is border + shadow, not a tint.
export default function ProductCard({
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
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-[transform,border-color,box-shadow] duration-300 ease-out-quint hover:border-obsidian/25 hover:shadow-lift motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-canvas ring-1 ring-inset ring-obsidian/[0.07]">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="block h-full w-full"
        >
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.04]"
          />
        </Link>

        {badge && (
          <span
            className={`absolute start-2.5 top-2.5 rounded-control px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}

        <button
          type="button"
          onClick={toggleFav}
          aria-pressed={fav}
          aria-label={t("favorite")}
          className="absolute end-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-control bg-white/95 text-slate ring-1 ring-obsidian/10 transition-colors hover:text-sale before:absolute before:-inset-1.5 before:content-['']"
        >
          <Heart
            size={15}
            weight={fav ? "fill" : "regular"}
            aria-hidden="true"
            className={fav ? "text-sale" : undefined}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <h3 className="line-clamp-2 text-balance text-[14px] font-semibold leading-[1.35] tracking-[-0.015em] text-obsidian">
          <Link href={href} className="transition-colors hover:text-primary">
            {title}
          </Link>
        </h3>

        <div className="mt-2 flex items-center gap-1.5">
          <span className="flex items-center gap-px" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                size={12}
                weight={i < Math.round(rating) ? "fill" : "regular"}
                className={i < Math.round(rating) ? "text-obsidian" : "text-slate/35"}
              />
            ))}
          </span>
          <span dir="ltr" className="text-[12px] font-semibold tabular-nums text-obsidian">
            {rating.toFixed(1)}
          </span>
          <span className="truncate text-[12px] text-slate">
            {t("card.reviews", { count: reviews })}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-3.5">
          <span dir="ltr" className="text-[16px] font-semibold tabular-nums tracking-[-0.01em] text-obsidian">
            {price}
          </span>
          {oldPrice && (
            <span dir="ltr" className="text-[12px] tabular-nums text-slate line-through">
              {oldPrice}
            </span>
          )}
          {savings !== null && (
            <span className="rounded-control bg-sale/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-sale">
              {t("card.save", { percent: savings })}
            </span>
          )}
          <span className="ms-auto flex items-center gap-1.5">
            {swatches.map((swatch, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-obsidian/10 transition-transform duration-200 motion-safe:group-hover:scale-110 ${swatch}`}
              />
            ))}
            <span className="text-[10px] font-medium tabular-nums text-slate">
              +{swatches.length}
            </span>
          </span>
        </div>

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
          className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-control text-[13px] font-semibold tracking-[0.01em] transition-colors duration-200 ${
            !product.inStock
              ? "cursor-not-allowed border border-line bg-canvas text-slate"
              : added
                ? "border border-obsidian bg-white text-obsidian"
                : "bg-obsidian text-white hover:bg-obsidian/90"
          }`}
        >
          <ShoppingCart size={15} weight="bold" aria-hidden="true" />
          <span className="flex items-center gap-1.5">
            {added && product.inStock && (
              <Check size={14} weight="bold" aria-hidden="true" className="text-success-deep" />
            )}
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
    </article>
  );
}
