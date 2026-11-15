"use client";

import {
  ArrowClockwise,
  ArrowRight,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { products } from "@/lib/products";
import { DUR, EASE } from "@/lib/motion";

const TRUST_ICONS = [Truck, ArrowClockwise, ShieldCheck];

export default function HeroBanner() {
  const t = useTranslations("hero");
  const tp = useTranslations("products");
  const locale = useLocale();
  const reduced = useReducedMotion();

  const feature = products.find((p) => p.id === "p2") ?? products[1];
  const deal = products.find((p) => p.id === "p1") ?? products[0];

  const format = new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  });
  const discount = deal.oldPrice
    ? `−${Math.round((1 - deal.price / deal.oldPrice) * 100)}${locale === "ar" ? "٪" : " %"}`
    : null;

  const trust = [t("trust.delivery"), t("trust.returns"), t("trust.payment")];

  const rise = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0 : DUR.enter,
      delay: reduced ? 0 : delay,
      ease: EASE,
    },
  });

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-[1.62fr_1fr]">
        <motion.div
          {...rise(0)}
          className="relative overflow-hidden rounded-2xl bg-well lg:min-h-[356px]"
        >
          <div className="relative z-10 flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-9 md:h-full md:max-w-[57%] md:py-9 md:ps-8 md:pe-4 lg:py-10 lg:ps-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary rtl:tracking-normal">
              {t("eyebrow")}
            </p>

            <h1 className="display-cut mt-3.5 text-[31px] leading-[1.06] text-obsidian sm:text-[38px] md:text-[34px] lg:text-[36px] xl:text-[40px] rtl:tracking-normal">
              {t("title")} {t("accent")}
            </h1>

            <p className="mt-3 max-w-[330px] text-[13px] leading-relaxed text-obsidian/65 sm:text-sm">
              {t("subtitle")}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href="#selection"
                className="group inline-flex h-11 items-center gap-2 rounded-pill bg-obsidian px-5 text-[13px] font-semibold text-white transition-colors hover:bg-obsidian/90 sm:text-sm"
              >
                {t("cta")}
                <ArrowRight
                  size={15}
                  weight="bold"
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                />
              </a>
              <p className="flex items-center gap-1.5 text-xs text-obsidian/65">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-success"
                />
                {t("stock")}
              </p>
            </div>

            <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-obsidian/65">
              {trust.map((label, i) => {
                const Icon = TRUST_ICONS[i];
                return (
                  <li key={label} className="flex items-center gap-1">
                    <Icon
                      size={14}
                      weight="regular"
                      aria-hidden="true"
                      className="shrink-0 text-obsidian/40"
                    />
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative h-48 w-full sm:h-64 md:absolute md:inset-y-0 md:end-0 md:h-full md:w-[43%]">
            <Image
              src={feature.image}
              alt={tp(`items.${feature.id}.title` as "items.p2.title")}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 40vw"
              className="object-cover mix-blend-multiply"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-well via-well/30 to-transparent md:block rtl:bg-gradient-to-l"
            />
          </div>
        </motion.div>

        <motion.div
          {...rise(0.1)}
          className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-primary p-6 text-white sm:p-7 md:flex-row md:items-end md:gap-6 lg:flex-col lg:items-stretch lg:gap-0 lg:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full border border-white/15"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -start-10 h-48 w-48 rounded-full border border-white/10"
          />

          <div className="relative">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95 rtl:tracking-normal">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white" />
              {t("deal.label")}
            </p>

            {discount && (
              <p className="display-cut mt-4 text-[52px] leading-none sm:text-[60px]">
                <span dir="ltr">{discount}</span>
              </p>
            )}

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95 rtl:tracking-normal">
              {deal.brand}
            </p>
            <h2 className="mt-1 text-[17px] font-semibold leading-snug sm:text-lg">
              {t("deal.title")}
            </h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span dir="ltr" className="text-[22px] font-semibold">
                {format.format(deal.price)}
              </span>
              {deal.oldPrice && (
                <span dir="ltr" className="text-[13px] text-white/95 line-through">
                  {format.format(deal.oldPrice)}
                </span>
              )}
            </div>
          </div>

          <a
            href="#selection"
            className="group relative mt-6 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-obsidian transition-colors hover:bg-obsidian hover:text-white md:mt-0"
          >
            {t("deal.cta")}
            <ArrowRight
              size={14}
              weight="bold"
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
}