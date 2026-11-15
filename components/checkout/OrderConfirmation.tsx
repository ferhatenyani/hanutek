"use client";

import { Check, CreditCard, MapPin, Truck, Wrench } from "@phosphor-icons/react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { COLORWAYS, SHIPPING, productById, type ShippingMethod } from "@/lib/products";
import { useOrder } from "@/lib/orders-store";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

export default function OrderConfirmation({ reference }: { reference: string }) {
  const t = useTranslations("order");
  const tc = useTranslations("cart");
  const tp = useTranslations("products");
  const tpr = useTranslations("product");
  const locale = useLocale();
  const order = useOrder(reference);

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
    [locale],
  );

  const longDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [locale],
  );

  if (!order) {
    return (
      <div className="bg-mist">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-8 sm:px-6 lg:pb-20">
          <div className="rounded-sheet border border-hairline bg-white shadow-soft">
            <EmptyState
              icon={<Wrench size={25} />}
              title={t("missingTitle")}
              body={t("missingBody")}
              action={t("browse")}
              actionHref={`/${locale}/products`}
            />
          </div>
        </div>
      </div>
    );
  }

  const method = order.shippingMethod as ShippingMethod;
  const rule = SHIPPING[method];
  const eta = new Date(order.placedAt);
  eta.setDate(eta.getDate() + rule.days);

  const stops = [t("timeline.1"), t("timeline.2"), t("timeline.3"), t("timeline.4")];

  return (
    <div className="min-h-[70dvh] bg-mist">
      <div className="mx-auto w-full max-w-[1080px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">
        <section
          aria-labelledby="order-heading"
          className="relative overflow-hidden rounded-sheet border border-hairline bg-white px-5 py-6 shadow-soft sm:px-7 lg:px-8 lg:py-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-mint-soft"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mint text-white shadow-[0_14px_30px_-14px_rgba(18,183,106,0.9)]"
              >
                <Check size={26} weight="bold" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mint-deep rtl:tracking-normal">
                  {t("eyebrow")}
                </p>
                <h1 id="order-heading" className="display-cut mt-1 text-[26px] leading-tight text-ink sm:text-[32px]">
                  {t("title")}
                </h1>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  {t("body", { name: order.address.fullName.split(" ")[0] })}
                </p>
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
                  <span>{t("reference")} :</span>
                  <span dir="ltr" className="rounded-full bg-mist px-2.5 py-1 font-semibold num text-ink">
                    {order.ref}
                  </span>
                  <span aria-hidden="true" className="h-3 w-px bg-hairline" />
                  <span dir="ltr">{longDate.format(new Date(order.placedAt))}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-7 rounded-soft-sm bg-mist/60 p-4">
            <ol className="grid gap-4 sm:grid-cols-4 sm:gap-0">
              {stops.map((label, index) => {
                const done = index === 0;
                const active = index === 1;
                return (
                  <li key={label} className="relative flex items-center gap-3 sm:block">
                    {index < stops.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute start-3 top-6 h-4 w-px sm:hidden",
                          index === 0 ? "bg-mint/40" : "bg-hairline",
                        )}
                      />
                    )}
                    <span className="flex items-center gap-0 sm:w-full">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold num",
                          done
                            ? "bg-mint text-white"
                            : active
                              ? "border border-mint bg-white text-mint-deep shadow-[0_0_0_3px_var(--color-mint-soft)]"
                              : "border border-hairline bg-white text-muted",
                        )}
                      >
                        {done ? <Check size={12} weight="bold" /> : index + 1}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "hidden h-0.5 flex-1 sm:block",
                          index === stops.length - 1
                            ? "opacity-0"
                            : index === 0
                              ? "bg-mint/40"
                              : "bg-hairline",
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        "text-[12px] sm:mt-2 sm:block",
                        done || active
                          ? "font-semibold text-ink"
                          : "text-muted",
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="relative mt-4 flex items-start gap-2.5 rounded-soft-sm bg-brand-soft px-3.5 py-3 text-[12.5px] font-medium leading-snug text-brand-deep">
            <Truck size={16} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
            {rule.days === 0
              ? t("etaPickup", { date: longDate.format(eta) })
              : t("eta", { date: longDate.format(eta) })}
          </p>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section
            aria-labelledby="items-heading"
            className="overflow-hidden rounded-sheet border border-hairline bg-white shadow-soft"
          >
            <h2
              id="items-heading"
              className="border-b border-hairline px-4 py-3.5 text-[14px] font-semibold text-ink sm:px-5"
            >
              {t("itemsTitle", { count: order.totals.itemCount })}
            </h2>
            <ul className="divide-y divide-hairline">
              {order.lines.map((line) => {
                const product = productById(line.id);
                return (
                  <li
                    key={`${line.id}-${line.colorway}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-soft-sm bg-mist ring-1 ring-inset ring-ink/[0.05]">
                      <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
                        {product ? tp(`items.${product.id}.title` as "items.p1.title") : line.id}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-3 w-3 rounded-full ring-1 ring-inset ring-ink/15",
                            COLORWAYS[line.colorway],
                          )}
                        />
                        {tc("colorway", {
                          color: tpr(`colors.${line.colorway}` as "colors.black"),
                        })}
                        <span aria-hidden="true">·</span>
                        <span dir="ltr" className="num">
                          {tc("eachQty", { qty: line.qty })}
                        </span>
                      </span>
                    </span>
                    <span dir="ltr" className="shrink-0 text-[13px] font-semibold num text-ink">
                      {money.format(line.unitPrice * line.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <dl className="flex flex-col gap-2.5 border-t border-hairline px-4 py-4 text-[13px] sm:px-5">
              <Line
                label={tc("subtotal", { count: order.totals.itemCount })}
                value={money.format(order.totals.subtotal)}
              />
              {order.totals.discount > 0 && (
                <Line
                  label={tc("discount", { code: "" })}
                  value={`-${money.format(order.totals.discount)}`}
                  tone="success"
                />
              )}
              <Line
                label={tc("shipping", {
                  method: tc(`methods.${method}.short` as "methods.standard.short"),
                })}
                value={
                  order.totals.shipping === 0
                    ? tc("shippingFree")
                    : money.format(order.totals.shipping)
                }
                tone={order.totals.shipping === 0 ? "success" : undefined}
              />
              <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
                <dt className="text-[13px] font-semibold text-ink">{tc("total")}</dt>
                <dd dir="ltr" className="display-cut text-[23px] leading-none num text-ink">
                  {money.format(order.totals.total)}
                </dd>
              </div>
            </dl>
          </section>

          <div className="flex flex-col gap-3">
            <section
              aria-labelledby="delivery-heading"
              className="rounded-sheet border border-hairline bg-white p-4 shadow-soft"
            >
              <h2
                id="delivery-heading"
                className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ink"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-soft text-mint-deep">
                  <MapPin size={15} aria-hidden="true" />
                </span>
                {t("deliveryTitle")}
              </h2>
              <p dir="ltr" className="mt-3 text-[12.5px] leading-relaxed text-ink">
                {order.address.fullName}
                <br />
                {order.address.line1}
                {order.address.line2 && (
                  <>
                    <br />
                    {order.address.line2}
                  </>
                )}
                <br />
                {order.address.postalCode} {order.address.city}
                <br />
                {order.address.country}
              </p>
              <p className="mt-2.5 text-[11.5px] text-muted">
                {t(`methods.${method}.title` as "methods.standard.title")} ·{" "}
                <span dir="ltr" className="num">
                  {order.address.phone}
                </span>
              </p>
            </section>

            <section
              aria-labelledby="pay-heading"
              className="rounded-sheet border border-hairline bg-white p-4 shadow-soft"
            >
              <h2
                id="pay-heading"
                className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ink"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <CreditCard size={15} aria-hidden="true" />
                </span>
                {t("paymentTitle")}
              </h2>
              <p dir="ltr" className="mt-3 text-[12.5px] font-semibold num text-ink">
                {order.card.brand} ·•••• {order.card.last4}
              </p>
              <p dir="ltr" className="mt-1 text-[11.5px] text-muted">
                {order.email}
              </p>
            </section>

            <div className="flex flex-col gap-2.5">
              <ButtonLink href={`/${locale}/products`} shape="pill" size="lg" block>
                {t("browse")}
              </ButtonLink>
              <ButtonLink
                href={`/${locale}/profile`}
                variant="outline"
                shape="pill"
                size="lg"
                block
              >
                {t("account")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({
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