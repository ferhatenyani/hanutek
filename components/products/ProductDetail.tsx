"use client";

import {
  ArrowClockwise,
  CheckCircle,
  ShieldCheck,
  Sparkle,
  Star,
  Truck,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Price from "@/components/ui/Price";
import Rating from "@/components/ui/Rating";
import {
  COLORWAYS,
  colorwaysOf,
  highlightKeysOf,
  specsOf,
  type ColorwayKey,
  type Product,
} from "@/lib/products";
import { ratingBreakdown, reviewsFor } from "@/lib/reviews";
import { pseudoRating, savingsOf, skuOf } from "./meta";
import { cn } from "@/lib/utils";

const BADGE_TONE = { best: "best", new: "new", promo: "promo" } as const;

/**
 * The whole product story, shared by the sliding sheet and the standalone
 * page so the two can never drift apart. Buying controls (quantity, the
 * add-to-cart action) are deliberately left to the caller: the sheet keeps
 * them in a sticky footer, the page in an inline buy panel.
 */
export default function ProductDetail({
  product,
  colorway,
  variant,
  onColorway,
  buySlot,
}: {
  product: Product;
  colorway: ColorwayKey;
  variant: "sheet" | "page";
  onColorway: (next: ColorwayKey) => void;
  buySlot?: React.ReactNode;
}) {
  const t = useTranslations("product");
  const tp = useTranslations("products");
  const locale = useLocale();
  const page = variant === "page";

  const title = tp(`items.${product.id}.title` as "items.p1.title");
  const { rating, reviews } = pseudoRating(product);
  const savings = savingsOf(product);
  const specs = specsOf(product);
  const highlights = highlightKeysOf(product);
  const voices = reviewsFor(product);
  const variants = colorwaysOf(product);
  const breakdown = useMemo(
    () => ratingBreakdown(rating, reviews),
    [rating, reviews],
  );

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
    [locale],
  );
  const plain = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const badge = product.badge
    ? {
        tone: BADGE_TONE[product.badge],
        label: tp(
          `badge${product.badge[0].toUpperCase()}${product.badge.slice(1)}` as "badgeNew",
        ),
      }
    : null;

  const trust = [
    { Icon: Truck, k: "delivery" },
    { Icon: ShieldCheck, k: "warranty" },
    { Icon: ArrowClockwise, k: "returns" },
  ] as const;

  return (
    <article
      className={cn(
        page
          ? "mx-auto w-full max-w-[1320px] px-4 pb-16 pt-3 sm:px-6 lg:px-8"
          : "px-4 pb-8 pt-1 sm:px-6",
      )}
    >
      <div
        className={cn(
          "grid gap-8",
          page
            ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14"
            : "md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:gap-8",
        )}
      >
        {/* Media --------------------------------------------------------- */}
        <div className={cn(page && "lg:sticky lg:top-[96px] lg:self-start")}>
          <div className="relative overflow-hidden rounded-sheet border border-hairline bg-mist p-3 shadow-soft">
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-[22px] bg-white/50",
                page ? "aspect-square" : "aspect-[5/4] md:aspect-square",
              )}
            >
              <Image
                src={product.image}
                alt={t("imageAlt", { title })}
                fill
                sizes={page ? "(max-width: 1023px) 100vw, 620px" : "(max-width: 1023px) 100vw, 420px"}
                priority={page}
                className="object-cover"
              />
            </div>
            {badge && (
              <span className="absolute start-5 top-5">
                <Badge tone={badge.tone} className="shadow-sm">
                  {badge.label}
                </Badge>
              </span>
            )}
            <span className="absolute bottom-5 end-5 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-muted shadow-sm backdrop-blur">
              <Sparkle size={11} weight="fill" aria-hidden="true" className="text-brand" />
              {t("photoNote")}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] text-muted">
            <span dir="ltr" className="num">
              {t("sku", { value: skuOf(product) })}
            </span>
            <span className="flex items-center gap-1">
              <Star size={11} weight="fill" aria-hidden="true" className="text-brand" />
              {rating.toFixed(1)} / 5
            </span>
          </div>

          <ul
            className={cn(
              "mt-4 grid grid-cols-3 gap-2",
              page && "hidden lg:grid",
            )}
          >
            {trust.map(({ Icon, k }) => (
              <li
                key={k}
                className="flex flex-col items-center gap-1.5 rounded-soft-sm border border-hairline bg-white px-2 py-3 text-center shadow-soft"
              >
                <Icon size={18} aria-hidden="true" className="text-brand" />
                <span className="text-[10.5px] font-semibold leading-tight text-ink">
                  {t(`trust.${k}.title` as "trust.delivery.title")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Purchase column --------------------------------------------- */}
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-deep rtl:tracking-normal">
              {product.brand}
            </span>
            <span className="rounded-full bg-mist px-2.5 py-1 text-[10.5px] font-semibold text-muted">
              {tp(`categories.${product.category}` as "categories.cameras")}
            </span>
          </div>

          {page && (
            <h1 className="display-cut mt-3 text-[28px] leading-[1.12] text-balance text-ink sm:text-[34px]">
              {title}
            </h1>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Rating value={rating} reviews={reviews} />
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                product.inStock
                  ? "bg-mint-soft text-mint-deep"
                  : "bg-sale/10 text-sale",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  product.inStock ? "bg-mint" : "bg-sale",
                )}
              />
              {product.inStock ? t("inStock") : t("outOfStock")}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 rounded-soft border border-hairline bg-white p-4 shadow-soft">
            <div>
              <Price
                value={money.format(product.price)}
                old={product.oldPrice ? money.format(product.oldPrice) : undefined}
                savings={savings !== null ? tp("card.save", { percent: savings }) : undefined}
                size="xl"
              />
              {product.oldPrice && (
                <p className="mt-1.5 text-[11.5px] font-medium text-mint-deep">
                  {t("youSave", { value: money.format(product.oldPrice - product.price) })}
                </p>
              )}
            </div>
            {product.inStock && (
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                <Truck size={14} aria-hidden="true" className="text-brand" />
                {t("deliveryShort")}
              </p>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[13px] font-semibold text-ink">{t("colorway")}</h2>
              <span className="text-[12px] font-medium text-muted">
                {t(`colors.${colorway}` as "colors.black")}
              </span>
            </div>
            <div role="radiogroup" aria-label={t("colorway")} className="mt-2.5 flex gap-3">
              {variants.map((key) => {
                const selected = key === colorway;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t(`colors.${key}` as "colors.black")}
                    onClick={() => onColorway(key)}
                    className={cn(
                      "h-10 w-10 rounded-full transition-[box-shadow,transform] duration-200 ease-out-quint",
                      COLORWAYS[key],
                      selected
                        ? "scale-105 shadow-[0_0_0_3px_var(--color-white),0_0_0_5px_var(--color-brand)]"
                        : "shadow-[inset_0_0_0_1px_rgba(16,24,40,0.16)] hover:scale-[1.05]",
                    )}
                  />
                );
              })}
            </div>
          </div>

          {page && buySlot}

          <p className="mt-6 max-w-[54ch] text-[14px] leading-relaxed text-muted">
            {t(`descriptions.${product.id}` as "descriptions.p1")}
          </p>

          <ul className="mt-5 grid gap-2.5 sm:grid-cols-1">
            {highlights.map((key) => (
              <li key={key} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-soft text-mint-deep">
                  <CheckCircle size={13} weight="fill" aria-hidden="true" />
                </span>
                <span className="text-[13.5px] leading-snug text-ink/80">
                  {t(`highlights.${product.id}.${key}` as "highlights.p1.install")}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {specs.slice(0, 3).map((row) => (
              <div
                key={row.labelKey}
                className="rounded-soft-sm border border-hairline bg-mist/70 px-3.5 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted rtl:tracking-normal">
                  {t(`specs.${row.labelKey}` as "specs.resolution")}
                </p>
                <p dir="ltr" className="mt-1 text-[15px] font-semibold num text-ink">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail band ------------------------------------------------- */}
      <div
        className={cn(
          "mt-10 grid gap-8 lg:mt-14 lg:gap-12",
          page && "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]",
        )}
      >
        <div className="flex flex-col gap-5">
          {specs.length > 3 && <MoreSpecs rows={specs.slice(3)} />}

          {page && (
            <ul className="grid gap-2.5 sm:grid-cols-3">
              {trust.map(({ Icon, k }) => (
                <li
                  key={k}
                  className="flex items-start gap-3 rounded-soft border border-hairline bg-white p-3.5 shadow-soft"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-semibold text-ink">
                      {t(`trust.${k}.title` as "trust.delivery.title")}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
                      {t(`trust.${k}.body` as "trust.delivery.body")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section aria-labelledby="reviews-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="reviews-heading" className="display-cut text-[20px] text-ink sm:text-[23px]">
                {t("reviewsTitle", { count: reviews })}
              </h2>
              <p className="mt-1 text-[12px] text-muted">{t("verifiedNote")}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-mint-soft px-3 py-1.5">
              <Star size={13} weight="fill" aria-hidden="true" className="text-mint-deep" />
              <span dir="ltr" className="text-[13px] font-bold num text-mint-deep">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-start gap-x-8 gap-y-5 rounded-soft border border-hairline bg-white p-4 shadow-soft sm:p-5">
            <div>
              <p dir="ltr" className="display-cut text-[42px] leading-none num text-ink">
                {rating.toFixed(1)}
              </p>
              <Rating value={rating} className="mt-2" />
            </div>

            <ul className="flex min-w-[180px] flex-1 flex-col gap-1.5">
              {breakdown.map((count, index) => {
                const stars = 5 - index;
                const share = reviews ? count / reviews : 0;
                return (
                  <li key={stars} className="flex items-center gap-2.5">
                    <span dir="ltr" className="w-2 text-[11px] font-semibold num text-muted">
                      {stars}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist"
                    >
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${Math.round(share * 100)}%` }}
                      />
                    </span>
                    <span dir="ltr" className="w-8 text-end text-[11px] num text-muted">
                      {plain.format(count)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <ul className="mt-4 flex flex-col gap-3">
            {voices.map((voice) => (
              <li
                key={voice.id}
                className="rounded-soft border border-hairline bg-white p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-[12px] font-bold text-brand-deep"
                    >
                      {voice.author.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{voice.author}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{voice.city}</p>
                    </div>
                  </div>
                  <Rating value={voice.rating} size={11} />
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-ink/75">
                  {t(`reviews.${voice.id}` as "reviews.r1")}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                  <CheckCircle size={12} weight="fill" aria-hidden="true" className="text-mint-deep" />
                  {t("verified")} · {t("daysAgo", { count: voice.daysAgo })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}

function MoreSpecs({ rows }: { rows: ReturnType<typeof specsOf> }) {
  const t = useTranslations("product");
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-soft border border-hairline bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between gap-3 px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-mist/60"
      >
        {t("allSpecs")}
        <span
          aria-hidden="true"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full bg-mist text-[15px] font-normal text-muted transition-transform duration-200",
            open && "rotate-45",
          )}
        >
          +
        </span>
      </button>

      {open && (
        <dl className="grid gap-x-8 gap-y-2.5 border-t border-hairline px-4 py-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.labelKey} className="flex items-baseline justify-between gap-4">
              <dt className="text-[12.5px] text-muted">
                {t(`specs.${row.labelKey}` as "specs.resolution")}
              </dt>
              <dd dir="ltr" className="text-[13px] font-semibold num text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}