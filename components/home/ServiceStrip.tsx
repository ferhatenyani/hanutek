"use client";

import { ArrowClockwise, ShieldCheck, Sparkle, Truck } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

const ITEMS = [
  { Icon: Truck, key: "delivery" },
  { Icon: ArrowClockwise, key: "returns" },
  { Icon: ShieldCheck, key: "warranty" },
  { Icon: Sparkle, key: "support" },
] as const;

/**
 * Reassurance band. Plain columns on a tinted rule rather than four cards, so
 * it reads as a footnote to the shop instead of a feature grid.
 */
export default function ServiceStrip() {
  const t = useTranslations("home");

  return (
    <section aria-labelledby="service-heading" className="mt-14 border-y border-line bg-canvas">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-9 sm:px-6 lg:px-8">
        <h2 id="service-heading" className="sr-only">
          {t("serviceTitle")}
        </h2>
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => (
            <li key={item.key} className="flex items-start gap-3">
              <item.Icon
                size={20}
                aria-hidden="true"
                className="mt-px shrink-0 text-blue"
              />
              <span>
                <span className="block text-[13.5px] font-semibold text-obsidian">
                  {t(`service.${item.key}.title` as "service.delivery.title")}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-slate">
                  {t(`service.${item.key}.body` as "service.delivery.body")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
