"use client";

import { Money, ShoppingCartSimple, Truck } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import CartLineCard from "@/components/cart/CartLineCard";
import EmptyState from "@/components/ui/EmptyState";
import { cartTotals, useCartLines } from "@/lib/cart-store";
import { formatDA } from "@/lib/money";

/** Minimal cart body for the bottom sheet: lines, total, cash-on-delivery note. */
export default function CartPanel() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const lines = useCartLines();
  const totals = cartTotals({ lines });

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCartSimple size={27} weight="bold" />}
        title={t("emptyTitle")}
        body={t("emptyBody")}
        action={t("browseCatalogue")}
        actionHref={`/${locale}/products`}
        actionVariant="primary"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-panel border border-line bg-white">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2.5 text-[14px] font-semibold text-ink">
            {t("itemsTitle")}
            <span className="num flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-soft px-2 text-[11px] font-bold text-blue-deep">
              {totals.itemCount}
            </span>
          </h2>
        </header>

        <ul className="divide-y divide-line">
          {lines.map((line) => (
            <li key={line.key}>
              <CartLineCard line={line} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-panel border border-line bg-white p-4 sm:p-5">
        <dl className="flex flex-col gap-2.5 text-[13px]">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">{t("subtotal", { count: totals.itemCount })}</dt>
            <dd dir="ltr" className="num font-semibold text-ink">
              {formatDA(totals.subtotal, locale)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Truck size={14} aria-hidden="true" className="text-success" />
              {t("shippingLabel")}
            </dt>
            <dd className="font-semibold text-success">{t("shippingFree")}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
          <p className="text-[13px] font-semibold text-ink">{t("total")}</p>
          <p dir="ltr" className="display-cut num text-[26px] leading-none text-ink">
            {formatDA(totals.total, locale)}
          </p>
        </div>

        <p className="mt-3 flex items-center gap-2 rounded-control bg-mist px-3 py-2.5 text-[12px] font-medium text-muted">
          <Money size={15} aria-hidden="true" className="shrink-0 text-ink" />
          {t("codNote")}
        </p>
      </section>
    </div>
  );
}