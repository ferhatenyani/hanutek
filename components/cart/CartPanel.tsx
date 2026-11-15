"use client";

import {
  ArrowRight,
  CheckCircle,
  LockKey,
  ShieldCheck,
  ShoppingCartSimple,
  Tag,
  Truck,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import CartLineCard from "@/components/cart/CartLineCard";
import EmptyState from "@/components/ui/EmptyState";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PROMOS, SHIPPING } from "@/lib/products";
import { cartStore, cartTotals, useCart, useCartLines } from "@/lib/cart-store";
import { checkoutStore, useCheckout } from "@/lib/checkout-store";
import { toastStore } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

/**
 * The cart body, shared by the sliding drawer and the standalone page. The
 * page gets a two-column composition with a sticky summary; the drawer gets one
 * column and relies on its pinned footer for the checkout action.
 */
export default function CartPanel({ layout = "page" }: { layout?: "sheet" | "page" }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const cart = useCart();
  const draft = useCheckout();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lines = useCartLines();

  const totals = cartTotals(cart, draft.shipping.method, draft.promo);
  const rule = SHIPPING[draft.shipping.method];
  const remaining = Math.max(0, rule.freeFrom - (totals.subtotal - totals.discount));
  const progress =
    rule.freeFrom > 0
      ? Math.min(100, Math.round(((totals.subtotal - totals.discount) / rule.freeFrom) * 100))
      : 100;

  const money = new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  const applyPromo = () => {
    const match = PROMOS.find((p) => p.code === code.trim().toUpperCase());
    if (!match) {
      setError(t("promoUnknown"));
      return;
    }
    if (totals.subtotal < match.minSubtotal) {
      setError(t("promoMin", { value: money.format(match.minSubtotal) }));
      return;
    }
    setError(null);
    checkoutStore.setPromo(match.code);
    toastStore.push({ message: t("promoApplied", { code: match.code }), tone: "success" });
  };

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
    <div
      className={cn(
        layout === "page"
          ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_392px] lg:items-start lg:gap-8"
          : "flex flex-col gap-5",
      )}
    >
      <section className="overflow-hidden rounded-sheet border border-hairline bg-white shadow-soft">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3.5 sm:px-5">
          <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
            {t("itemsTitle")}
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-soft px-2 text-[11px] font-bold num text-brand-deep">
              {totals.itemCount}
            </span>
          </h2>
          <button
            type="button"
            onClick={() => {
              cartStore.clear();
              toastStore.push({ message: t("emptied"), tone: "neutral" });
            }}
            className="text-[12px] font-medium text-muted underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
          >
            {t("emptyCart")}
          </button>
        </header>

        <ul className="divide-y divide-hairline">
          {lines.map((line) => (
            <li key={line.key}>
              <CartLineCard line={line} />
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-hairline bg-mist/60 px-4 py-3 sm:px-5">
          <p className="text-[12px] text-muted">{t("keepShoppingNote")}</p>
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand transition-colors hover:text-brand-deep"
          >
            {t("keepShopping")}
            <ArrowRight size={13} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
          </Link>
        </div>
      </section>

      <aside
        className={cn(
          "flex flex-col gap-3",
          layout === "page" && "lg:sticky lg:top-[92px]",
        )}
      >
        <div className="rounded-sheet border border-hairline bg-white p-4 shadow-soft sm:p-5">
          <h2 className="display-cut text-[17px] text-ink">{t("summary")}</h2>

          <div className="mt-3 rounded-soft-sm bg-brand-tint p-3">
            <p
              className={cn(
                "flex items-start gap-2 text-[12px] font-medium leading-snug",
                remaining > 0 ? "text-ink" : "text-mint-deep",
              )}
            >
              {remaining > 0 ? (
                <Truck size={15} aria-hidden="true" className="mt-px shrink-0 text-brand" />
              ) : (
                <CheckCircle size={15} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
              )}
              {remaining > 0
                ? t("freeShippingLeft", { value: money.format(remaining) })
                : t("freeShippingWon")}
            </p>
            <div
              aria-hidden="true"
              className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-brand-soft"
            >
              <span
                className={cn(
                  "block h-full rounded-full transition-[width] duration-500",
                  remaining > 0 ? "bg-brand" : "bg-mint",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <dl className="mt-4 flex flex-col gap-2.5 text-[13px]">
            <Row
              label={t("subtotal", { count: totals.itemCount })}
              value={money.format(totals.subtotal)}
            />
            {totals.discount > 0 && (
              <Row
                label={t("discount", { code: draft.promo ?? "" })}
                value={`-${money.format(totals.discount)}`}
                tone="success"
              />
            )}
            <Row
              label={t("shipping", {
                method: t(`methods.${draft.shipping.method}.short` as "methods.standard.short"),
              })}
              value={totals.shipping === 0 ? t("shippingFree") : money.format(totals.shipping)}
              tone={totals.shipping === 0 ? "success" : undefined}
            />
          </dl>

          <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-hairline pt-4">
            <p className="text-[13px] font-semibold text-ink">{t("total")}</p>
            <p dir="ltr" className="display-cut text-[26px] leading-none num text-ink">
              {money.format(totals.total)}
            </p>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">{t("vatNote")}</p>

          {layout === "page" && (
            <ButtonLink
              href={`/${locale}/checkout`}
              shape="pill"
              size="xl"
              block
              className="mt-4 hidden lg:inline-flex"
              trailing={<ArrowRight size={16} weight="bold" aria-hidden="true" className="rtl:rotate-180" />}
            >
              {t("checkout")}
            </ButtonLink>
          )}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <LockKey size={12} aria-hidden="true" />
            {t("secureNote")}
          </p>
        </div>

        {/* Promo */}
        {draft.promo ? (
          <div className="flex items-center justify-between gap-3 rounded-soft border border-mint/25 bg-mint-soft px-3.5 py-3">
            <p className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium text-mint-deep">
              <Tag size={15} weight="fill" aria-hidden="true" className="shrink-0" />
              <span className="truncate">{t("promoActive", { code: draft.promo })}</span>
            </p>
            <button
              type="button"
              onClick={() => checkoutStore.setPromo(null)}
              className="shrink-0 text-[12px] font-semibold text-mint-deep/80 underline underline-offset-4 transition-colors hover:text-mint-deep"
            >
              {t("promoRemove")}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              applyPromo();
            }}
            className="rounded-soft border border-hairline bg-white p-3 shadow-soft"
          >
            <label htmlFor={`promo-${layout}`} className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted rtl:tracking-normal">
              {t("promoLabel")}
            </label>
            <div className="mt-2 flex items-start gap-2">
              <div className="flex-1">
                <input
                  id={`promo-${layout}`}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder={t("promoPlaceholder")}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `promo-error-${layout}` : undefined}
                  autoComplete="off"
                  className={cn(
                    "h-11 w-full rounded-soft-sm border bg-mist/60 px-3 text-[13px] uppercase tracking-[0.06em] text-ink transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/75 hover:border-brand/30 focus:border-brand focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/10",
                    error ? "border-sale" : "border-hairline",
                  )}
                />
                {error && (
                  <p id={`promo-error-${layout}`} role="alert" className="mt-1.5 text-[12px] font-medium text-sale">
                    {error}
                  </p>
                )}
              </div>
              <Button type="submit" variant="outline" size="md" className="h-11 shrink-0">
                {t("promoApply")}
              </Button>
            </div>
          </form>
        )}

        <ul className="flex flex-col gap-2 rounded-soft border border-hairline bg-white px-4 py-3 shadow-soft">
          {[t("assureDelivery"), t("assureReturns")].map((line) => (
            <li key={line} className="flex items-center gap-2 text-[11.5px] text-muted">
              <ShieldCheck size={14} aria-hidden="true" className="shrink-0 text-mint-deep" />
              {line}
            </li>
          ))}
        </ul>
      </aside>

      {layout === "page" && (
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-30 flex items-center gap-3 rounded-soft border border-hairline bg-white/95 p-3 shadow-pop backdrop-blur-xl lg:hidden">
          <div className="shrink-0">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-muted rtl:tracking-normal">
              {t("total")}
            </p>
            <p dir="ltr" className="text-[17px] font-bold leading-tight num text-ink">
              {money.format(totals.total)}
            </p>
          </div>
          <ButtonLink
            href={`/${locale}/checkout`}
            shape="pill"
            size="lg"
            className="flex-1"
            trailing={<ArrowRight size={15} weight="bold" aria-hidden="true" className="rtl:rotate-180" />}
          >
            {t("checkout")}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd
        dir="ltr"
        className={cn("font-semibold num", tone === "success" ? "text-mint-deep" : "text-ink")}
      >
        {value}
      </dd>
    </div>
  );
}