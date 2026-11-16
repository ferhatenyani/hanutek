"use client";

import { ArrowRight, CaretLeft, CaretRight, ShieldCheck, Truck, Money } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import PaginationDots from "@/components/ui/PaginationDots";
import { formatDA } from "@/lib/money";
import { EASE } from "@/lib/motion";
import { products } from "@/lib/products";
import { cn } from "@/lib/utils";

const TRUST = [
  { Icon: Truck, key: "delivery" },
  { Icon: Money, key: "payment" },
  { Icon: ShieldCheck, key: "returns" },
] as const;

/**
 * Mobile-first promo deck: two swipeable slides (brand promise, featured deal)
 * with pagination dots and edge arrows. The same deck widens on desktop
 * instead of switching to a different layout.
 */
export default function HeroBanner() {
  const t = useTranslations("hero");
  const tp = useTranslations("products");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  const feature = products.find((p) => p.id === "p2") ?? products[1];
  const deal = products.find((p) => p.id === "p1") ?? products[0];
  const discount = deal.oldPrice
    ? Math.round((1 - deal.price / deal.oldPrice) * 100)
    : null;

  const count = 2;
  const go = (next: number) => setIndex(Math.max(0, Math.min(count - 1, next)));

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="relative overflow-hidden rounded-panel border border-line bg-white shadow-soft">
        <motion.div
          drag={reduced ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(index + 1);
            else if (info.offset.x > 60) go(index - 1);
          }}
          animate={{ x: `-${index * 100}%` }}
          transition={{ duration: reduced ? 0 : 0.45, ease: EASE }}
          className="flex"
        >
          {/* Slide 1 — brand promise on ink. */}
          <div className="relative w-full shrink-0 bg-ink text-white">
            <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 md:min-h-[380px] md:max-w-[58%] md:py-10 lg:ps-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 rtl:tracking-normal">
                {t("eyebrow")}
              </p>
              <h1 className="display-cut mt-3 text-[30px] leading-[1.05] sm:text-[40px] lg:text-[44px] rtl:tracking-normal">
                {t("title")} <span className="text-blue-soft">{t("accent")}</span>
              </h1>
              <p className="mt-3 max-w-[36ch] text-[13px] leading-relaxed text-white/70 sm:text-sm">
                {t("subtitle")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                <a
                  href="#selection"
                  className="group inline-flex h-11 items-center gap-2 rounded-control bg-blue px-5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-deep sm:text-sm"
                >
                  {t("cta")}
                  <ArrowRight
                    size={15}
                    weight="bold"
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  />
                </a>
                <Link
                  href={`/${locale}/products`}
                  className="text-[13px] font-semibold text-white/70 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
                >
                  {t("browseAll")}
                </Link>
              </div>
              <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/60">
                {TRUST.map(({ Icon, key }) => (
                  <li key={key} className="flex items-center gap-1.5">
                    <Icon size={14} aria-hidden="true" className="shrink-0 text-white/45" />
                    {t(`trust.${key}` as "trust.delivery")}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-44 w-full sm:h-56 md:absolute md:inset-y-0 md:end-0 md:h-full md:w-[42%]">
              <Image
                src={feature.image}
                alt={tp(`items.${feature.id}.title` as "items.p2.title")}
                fill
                priority
                sizes="(max-width: 767px) 100vw, 40vw"
                className="object-cover opacity-90"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent md:bg-gradient-to-r md:from-ink md:via-ink/30 md:to-transparent rtl:md:bg-gradient-to-l"
              />
            </div>
          </div>

          {/* Slide 2 — the featured deal on mist. */}
          <div className="relative w-full shrink-0 bg-mist text-ink">
            <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 md:min-h-[380px] md:max-w-[58%] md:py-10 lg:ps-10">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sale rtl:tracking-normal">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-sale" />
                {t("deal.label")}
              </p>
              {discount !== null && (
                <p className="display-cut mt-3 text-[52px] leading-none text-sale sm:text-[64px]">
                  <span dir="ltr">−{discount}%</span>
                </p>
              )}
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted rtl:tracking-normal">
                {deal.brand}
              </p>
              <h2 className="mt-1 max-w-[24ch] text-[17px] font-semibold leading-snug sm:text-lg">
                {t("deal.title")}
              </h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span dir="ltr" className="num text-[22px] font-semibold">
                  {formatDA(deal.price, locale)}
                </span>
                {deal.oldPrice && (
                  <span dir="ltr" className="num text-[13px] text-faint line-through">
                    {formatDA(deal.oldPrice, locale)}
                  </span>
                )}
              </div>
              <div className="mt-5">
                <Link
                  href={`/${locale}/product/${deal.id}`}
                  className="group inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-[13px] font-semibold text-white transition-colors hover:bg-ink-soft sm:text-sm"
                >
                  {t("deal.cta")}
                  <ArrowRight
                    size={15}
                    weight="bold"
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
            <div className="relative h-44 w-full sm:h-56 md:absolute md:inset-y-0 md:end-0 md:h-full md:w-[42%]">
              <Image
                src={deal.image}
                alt={tp(`items.${deal.id}.title` as "items.p1.title")}
                fill
                sizes="(max-width: 767px) 100vw, 40vw"
                className="object-cover mix-blend-multiply"
              />
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex justify-center">
          <div className="pointer-events-auto">
            <PaginationDots
              total={count}
              current={index}
              onSelect={go}
              tone={index === 0 ? "white" : "ink"}
              labelFor={(i) => t("slideDot", { index: i + 1, total: count })}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label={t("slidePrev")}
          className={cn(
            "absolute start-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-control backdrop-blur transition-colors disabled:opacity-0 sm:flex rtl:-scale-x-100",
            index === 0 ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-ink shadow-soft hover:bg-mist",
          )}
        >
          <CaretLeft size={16} weight="bold" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          aria-label={t("slideNext")}
          className={cn(
            "absolute end-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-control backdrop-blur transition-colors disabled:opacity-0 sm:flex rtl:-scale-x-100",
            index === 0 ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-ink shadow-soft hover:bg-mist",
          )}
        >
          <CaretRight size={16} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}