"use client";

import { Check, Heart, ShoppingCart } from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { memo, useId } from "react";
import { savingsOf } from "./meta";
import { useCardCart } from "./useCardCart";
import type { Product } from "@/lib/products";

const BADGE_CLASS = {
  best: "bg-ink text-white",
  new: "bg-blue text-white",
  promo: "bg-sale text-white",
} as const;

/**
 * The single production card, shared by home rails, catalogue and favourites.
 * 12px roundness, small title, gray description with a full-text tooltip,
 * price and one add-to-cart CTA. No ratings, no variant swatches.
 */
function ProductCard({
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
  const td = useTranslations("product");
  const locale = useLocale();
  const href = `/${locale}/product/${product.id}`;
  const { fav, added, inCart, addToCart, toggleFav } = useCardCart(product);
  const savings = savingsOf(product);
  const description = td(`descriptions.${product.id}` as "descriptions.p1");
  const descId = useId();
  const badge = product.badge
    ? {
        cls: BADGE_CLASS[product.badge],
        label: t(
          (product.badge === "best"
            ? "badgeBestShort"
            : `badge${product.badge[0].toUpperCase()}${product.badge.slice(1)}`) as "badgeNew",
        ),
      }
    : null;

  return (
    <article
      data-testid="product-card"
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-[transform,border-color,box-shadow] duration-300 ease-out-quint hover:border-ink/20 hover:shadow-lift motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-mist">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block h-full w-full"
        >
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
            className="object-cover transition-transform duration-500 ease-out-quint motion-safe:group-hover:scale-[1.04]"
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
          className="absolute end-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-control bg-white/95 text-muted ring-1 ring-ink/10 transition-colors hover:text-sale before:absolute before:-inset-1.5 before:content-['']"
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
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.35] tracking-[-0.01em] text-ink">
          <Link href={href} className="transition-colors hover:text-blue">
            {title}
          </Link>
        </h3>

        <div
          tabIndex={0}
          aria-describedby={descId}
          className="group/desc relative mt-1 cursor-help rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-blue/40"
        >
          <p className="line-clamp-2 text-[12px] leading-[1.45] text-muted">
            {description}
          </p>
          <span
            id={descId}
            role="tooltip"
            className="pointer-events-none absolute bottom-full start-0 z-20 mb-1.5 w-[230px] rounded-control bg-ink px-3 py-2 text-[11px] leading-relaxed text-white opacity-0 shadow-pop transition-opacity duration-150 group-hover/desc:opacity-100 group-focus-visible/desc:opacity-100"
          >
            {description}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-3">
          <span dir="ltr" className="num text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {price}
          </span>
          {oldPrice && (
            <span dir="ltr" className="num text-[12px] text-faint line-through">
              {oldPrice}
            </span>
          )}
          {savings !== null && (
            <span className="num rounded-control bg-sale-soft px-1.5 py-0.5 text-[10px] font-semibold text-sale">
              {t("card.save", { percent: savings })}
            </span>
          )}
        </div>

        <button
          type="button"
          data-testid="card-add"
          onClick={(event) => addToCart(event.currentTarget)}
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
              ? "cursor-not-allowed border border-line bg-mist text-faint"
              : added
                ? "border border-ink bg-white text-ink"
                : "bg-blue text-white hover:bg-blue-deep"
          }`}
        >
          <ShoppingCart size={15} weight="bold" aria-hidden="true" />
          <span className="flex items-center gap-1.5">
            {added && product.inStock && (
              <Check size={14} weight="bold" aria-hidden="true" className="text-success" />
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

export default memo(ProductCard);