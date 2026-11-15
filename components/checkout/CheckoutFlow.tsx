"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  LockKey,
  MapPin,
  ShieldCheck,
  ShoppingCartSimple,
  Truck,
  UserFocus,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, TextInput } from "@/components/ui/Field";
import ChoiceCard from "@/components/ui/ChoiceCard";
import EmptyState from "@/components/ui/EmptyState";
import Steps from "@/components/ui/Steps";
import { Button as StatefulButton } from "@/components/ui/library/stateful-button";
import { cartStore, cartTotals, useCart, useCartLines } from "@/lib/cart-store";
import {
  checkoutStore,
  maskCard,
  maskExpiry,
  maskPhone,
  useCheckout,
  validateStep,
  validators,
  type ErrorMap,
  type FieldError,
} from "@/lib/checkout-store";
import { SHIPPING, type ShippingMethod } from "@/lib/products";
import { cardBrandOf, orderRef, ordersStore, type Order } from "@/lib/orders-store";
import { useSession } from "@/lib/session-store";
import { toastStore } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

export default function CheckoutFlow() {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const tp = useTranslations("products");
  const tpr = useTranslations("product");
  const locale = useLocale();
  const router = useRouter();

  const user = useSession();
  const cart = useCart();
  const lines = useCartLines();
  const draft = useCheckout();

  const [errors, setErrors] = useState<ErrorMap>({});
  const [furthest, setFurthest] = useState(draft.step);
  const [terms, setTerms] = useState(false);
  const [placing, setPlacing] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const step = draft.step;
  const totals = cartTotals(cart, draft.shipping.method, draft.promo);
  const paymentErrors = validateStep(draft, 2);
  const canPay = Object.keys(paymentErrors).length === 0 && terms;
  const freeFrom = SHIPPING[draft.shipping.method].freeFrom;
  const remaining = Math.max(0, freeFrom - (totals.subtotal - totals.discount));

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
    [locale],
  );

  // Prefill from the signed-in account exactly once, without overwriting typing.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;
    const [firstName = "", lastName = ""] = user.name.split(/\s+/);
    const contact = checkoutStore.get().contact;
    checkoutStore.patch("contact", {
      email: contact.email || user.email,
      firstName: contact.firstName || firstName,
      lastName: contact.lastName || lastName,
      phone: contact.phone || user.phone,
    });
    if (!checkoutStore.get().shipping.line1 && user.addresses[0]) {
      checkoutStore.useAddress(user.addresses[0]);
    }
  }, [user]);

  const goto = (next: number) => {
    checkoutStore.setStep(next);
    setFurthest((value) => Math.max(value, next));
    setErrors({});
    summaryRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const advance = () => {
    const found = validateStep(draft, step);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    goto(step + 1);
  };

  const pay = () => {
    if (!canPay) return;
    setPlacing(true);

    const digits = draft.payment.card.replace(/\D/g, "");
    const order: Order = {
      ref: orderRef(),
      placedAt: new Date().toISOString(),
      status: "processing",
      email: draft.contact.email,
      lines: cart.lines.map((line) => {
        const found = lines.find((l) => l.key === line.key);
        return {
          id: line.id,
          image: found?.product.image ?? "",
          qty: line.qty,
          colorway: line.colorway,
          unitPrice: found?.product.price ?? 0,
        };
      }),
      totals,
      shippingMethod: draft.shipping.method,
      address: {
        id: "checkout",
        label: t("addressLabel"),
        fullName: `${draft.contact.firstName} ${draft.contact.lastName}`.trim(),
        phone: draft.contact.phone,
        line1: draft.shipping.line1,
        line2: draft.shipping.line2,
        postalCode: draft.shipping.postalCode,
        city: draft.shipping.city,
        country: draft.shipping.country,
      },
      card: { brand: cardBrandOf(digits), last4: digits.slice(-4) },
    };

    ordersStore.place(order);
    if (user) {
      checkoutStore.useAddress(order.address);
    }
    cartStore.clear();
    checkoutStore.reset();
    toastStore.push({ message: t("confirmedToast"), tone: "success" });
    router.push(`/${locale}/order/${order.ref}`);
  };

  if (lines.length === 0 && !placing) {
    return (
      <div className="bg-mist">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-8 sm:px-6 lg:pb-20">
          <div className="rounded-sheet border border-hairline bg-white shadow-soft">
            <EmptyState
              icon={<ShoppingCartSimple size={25} weight="bold" />}
              title={tc("emptyTitle")}
              body={t("emptyBody")}
              action={tc("browseCatalogue")}
              actionHref={`/${locale}/products`}
            />
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: "contact", label: t("steps.contact") },
    { id: "shipping", label: t("steps.shipping") },
    { id: "payment", label: t("steps.payment") },
  ];

  const errorText = (field: string) =>
    errors[field] ? t(`errors.${errors[field]!.code}` as "errors.required") : undefined;

  return (
    <div className="min-h-[70dvh] bg-mist">
      <div className="mx-auto w-full max-w-[1240px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-5 sm:px-6 lg:px-8 lg:pb-20 lg:pt-7">
        {/* Header ----------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}/cart`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-white px-4 text-[12.5px] font-semibold text-ink shadow-soft transition-colors hover:border-brand/30 hover:text-brand"
          >
            <ArrowLeft size={14} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
            {t("backToCart")}
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1.5 text-[11px] font-semibold text-mint-deep">
            <ShieldCheck size={14} weight="fill" aria-hidden="true" />
            {t("secure")}
          </span>
        </div>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand rtl:tracking-normal">
              {t("eyebrow")}
            </p>
            <h1 className="display-cut mt-1.5 text-[30px] leading-tight text-ink sm:text-[38px]">
              {t("title")}
            </h1>
            <p className="mt-1.5 max-w-[52ch] text-[13.5px] text-muted">{t("subtitle")}</p>
          </div>

          <div className="hidden w-full max-w-[420px] lg:block">
            <Steps steps={steps} current={step} furthest={furthest} onSelect={goto} />
          </div>
        </header>

        <div className="mt-5 lg:hidden">
          <Steps steps={steps} current={step} furthest={furthest} onSelect={goto} />
        </div>

        {/* Body ------------------------------------------------------- */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_392px] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-3.5">
            <Step
              index={0}
              openIndex={step}
              title={t("steps.contact")}
              hint={t("steps.contactHint")}
              summary={draft.contact.email}
              onEdit={() => goto(0)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="co-email"
                  className="sm:col-span-2"
                  label={t("fields.email")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={draft.contact.email}
                  onChange={(value) => checkoutStore.patch("contact", { email: value })}
                  onBlur={() => setError("email", validators.email(draft.contact.email))}
                  error={errorText("email")}
                  hint={user ? undefined : t("guestHint")}
                />
                <TextInput
                  id="co-first"
                  label={t("fields.firstName")}
                  autoComplete="given-name"
                  value={draft.contact.firstName}
                  onChange={(value) => checkoutStore.patch("contact", { firstName: value })}
                  onBlur={() => setError("firstName", validators.name(draft.contact.firstName))}
                  error={errorText("firstName")}
                />
                <TextInput
                  id="co-last"
                  label={t("fields.lastName")}
                  autoComplete="family-name"
                  value={draft.contact.lastName}
                  onChange={(value) => checkoutStore.patch("contact", { lastName: value })}
                  onBlur={() => setError("lastName", validators.name(draft.contact.lastName))}
                  error={errorText("lastName")}
                />
                <TextInput
                  id="co-phone"
                  className="sm:col-span-2"
                  label={t("fields.phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={draft.contact.phone}
                  onChange={(value) => checkoutStore.patch("contact", { phone: maskPhone(value) })}
                  onBlur={() => setError("phone", validators.phone(draft.contact.phone))}
                  error={errorText("phone")}
                  hint={t("phoneHint")}
                />
              </div>
            </Step>

            <Step
              index={1}
              openIndex={step}
              title={t("steps.shipping")}
              hint={t("steps.shippingHint")}
              summary={
                draft.shipping.line1
                  ? `${draft.shipping.line1}, ${draft.shipping.postalCode} ${draft.shipping.city}`
                  : undefined
              }
              onEdit={() => goto(1)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="sh-line1"
                  className="sm:col-span-2"
                  label={t("fields.address")}
                  autoComplete="address-line1"
                  value={draft.shipping.line1}
                  onChange={(value) => checkoutStore.patch("shipping", { line1: value })}
                  onBlur={() => setError("line1", validators.line1(draft.shipping.line1))}
                  error={errorText("line1")}
                />
                <TextInput
                  id="sh-line2"
                  className="sm:col-span-2"
                  label={t("fields.address2")}
                  optional={t("optional")}
                  autoComplete="address-line2"
                  value={draft.shipping.line2}
                  onChange={(value) => checkoutStore.patch("shipping", { line2: value })}
                />
                <TextInput
                  id="sh-postal"
                  label={t("fields.postal")}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={draft.shipping.postalCode}
                  onChange={(value) =>
                    checkoutStore.patch("shipping", {
                      postalCode: value.replace(/[^\d ]/g, ""),
                    })
                  }
                  onBlur={() =>
                    setError("postalCode", validators.postalCode(draft.shipping.postalCode))
                  }
                  error={errorText("postalCode")}
                />
                <TextInput
                  id="sh-city"
                  label={t("fields.city")}
                  autoComplete="address-level2"
                  value={draft.shipping.city}
                  onChange={(value) => checkoutStore.patch("shipping", { city: value })}
                  onBlur={() => setError("city", validators.city(draft.shipping.city))}
                  error={errorText("city")}
                />
              </div>

              <fieldset className="mt-6">
                <legend className="mb-2.5 text-[13px] font-semibold text-ink">
                  {t("method")}
                </legend>
                <ChoiceCard
                  name="shipping-method"
                  value={draft.shipping.method}
                  onChange={(value) =>
                    checkoutStore.patch("shipping", { method: value as ShippingMethod })
                  }
                  options={(Object.keys(SHIPPING) as ShippingMethod[]).map((method) => ({
                    value: method,
                    title: t(`methods.${method}.title` as "methods.standard.title"),
                    description: t(`methods.${method}.eta` as "methods.standard.eta"),
                    trailing:
                      SHIPPING[method].cost === 0
                        ? t("free")
                        : money.format(SHIPPING[method].cost),
                  }))}
                />
                <p className="mt-2.5 text-[11.5px] leading-snug text-muted">
                  {t("freeShippingNote", {
                    value: money.format(SHIPPING[draft.shipping.method].freeFrom),
                  })}
                </p>
              </fieldset>
            </Step>

            <Step
              index={2}
              openIndex={step}
              title={t("steps.payment")}
              hint={t("steps.paymentHint")}
              summary={
                draft.payment.card
                  ? `${cardBrandOf(draft.payment.card)} •••• ${draft.payment.card.replace(/\D/g, "").slice(-4)}`
                  : undefined
              }
              onEdit={() => goto(2)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="pay-holder"
                  className="sm:col-span-2"
                  label={t("fields.holder")}
                  autoComplete="cc-name"
                  value={draft.payment.holder}
                  onChange={(value) => checkoutStore.patch("payment", { holder: value })}
                  onBlur={() => setError("holder", validators.holder(draft.payment.holder))}
                  error={errorText("holder")}
                />
                <TextInput
                  id="pay-card"
                  className="sm:col-span-2"
                  label={t("fields.card")}
                  autoComplete="cc-number"
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="4242 4242 4242 4242"
                  value={draft.payment.card}
                  onChange={(value) => checkoutStore.patch("payment", { card: maskCard(value) })}
                  onBlur={() => setError("card", validators.card(draft.payment.card))}
                  error={errorText("card")}
                  hint={t("cardHint")}
                  trailing={<CreditCard size={17} aria-hidden="true" />}
                />
                <TextInput
                  id="pay-expiry"
                  label={t("fields.expiry")}
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder={t("expiryPlaceholder")}
                  value={draft.payment.expiry}
                  onChange={(value) => checkoutStore.patch("payment", { expiry: maskExpiry(value) })}
                  onBlur={() => setError("expiry", validators.expiry(draft.payment.expiry))}
                  error={errorText("expiry")}
                />
                <TextInput
                  id="pay-cvc"
                  label={t("fields.cvc")}
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  maxLength={4}
                  value={draft.payment.cvc}
                  onChange={(value) =>
                    checkoutStore.patch("payment", { cvc: value.replace(/\D/g, "") })
                  }
                  onBlur={() => setError("cvc", validators.cvc(draft.payment.cvc))}
                  error={errorText("cvc")}
                />
              </div>

              <Checkbox
                id="co-terms"
                className="mt-5"
                checked={terms}
                onChange={setTerms}
                label={t("terms")}
                description={t("termsNote")}
              />

              <div className="mt-5 flex flex-col gap-3 rounded-soft-sm border border-hairline bg-mist/60 p-3.5">
                <StatefulButton
                  onClick={pay}
                  disabled={!canPay}
                  className="h-14 w-full rounded-full !bg-brand px-6 text-[15px] font-semibold !text-white hover:!bg-brand-deep hover:ring-brand"
                >
                  {t("pay", { value: money.format(totals.total) })}
                </StatefulButton>

                {!canPay && (
                  <p className="text-center text-[11.5px] leading-snug text-muted">
                    {Object.keys(paymentErrors).length > 0
                      ? t("payIncomplete")
                      : t("payNeedsTerms")}
                  </p>
                )}

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                  <LockKey size={12} aria-hidden="true" />
                  {t("secureNote")}
                </p>
              </div>
            </Step>

            {step < 2 && (
              <div className="flex flex-col-reverse gap-3 rounded-sheet border border-hairline bg-white px-4 py-3.5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <Link
                  href={`/${locale}/cart`}
                  className="text-center text-[12.5px] font-medium text-muted underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
                >
                  {t("cancel")}
                </Link>
                <Button
                  size="lg"
                  shape="pill"
                  onClick={advance}
                  trailing={<ArrowRight size={16} weight="bold" aria-hidden="true" className="rtl:rotate-180" />}
                >
                  {step === 0 ? t("continueToShipping") : t("continueToPayment")}
                </Button>
              </div>
            )}

            <p className="rounded-soft-sm bg-brand-tint px-4 py-3 text-[11.5px] leading-snug text-muted">
              {t("demoNote")}
            </p>
          </div>

          <aside className="lg:sticky lg:top-[92px] lg:self-start" ref={summaryRef}>
            <div className="overflow-hidden rounded-sheet border border-hairline bg-white shadow-soft">
              <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3.5">
                <h2 className="text-[15px] font-semibold text-ink">{t("summary")}</h2>
                <Link
                  href={`/${locale}/cart`}
                  className="text-[12px] font-semibold text-brand underline underline-offset-4 transition-colors hover:text-brand-deep"
                >
                  {t("edit")}
                </Link>
              </div>

              <ul className="flex flex-col gap-3 px-4 py-4">
                {lines.map((line) => (
                  <li key={line.key} className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-mist ring-1 ring-inset ring-ink/[0.05]">
                      <Image
                        src={line.product.image}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                      <span
                        dir="ltr"
                        className="absolute -end-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold num text-white ring-2 ring-white"
                      >
                        {line.qty}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[12.5px] font-medium leading-snug text-ink">
                        {tp(`items.${line.product.id}.title` as "items.p1.title")}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {tc("colorway", {
                          color: tpr(`colors.${line.colorway}` as "colors.black"),
                        })}
                      </span>
                    </span>
                    <span dir="ltr" className="shrink-0 text-[12.5px] font-semibold num text-ink">
                      {money.format(line.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              {remaining > 0 ? (
                <p className="mx-4 mb-3 flex items-start gap-2 rounded-soft-sm bg-brand-tint px-3 py-2.5 text-[11px] leading-snug text-ink">
                  <Truck size={14} aria-hidden="true" className="mt-px shrink-0 text-brand" />
                  {t("freeShippingLeft", { value: money.format(remaining) })}
                </p>
              ) : (
                <p className="mx-4 mb-3 flex items-start gap-2 rounded-soft-sm bg-mint-soft px-3 py-2.5 text-[11px] font-medium leading-snug text-mint-deep">
                  <Check size={13} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
                  {t("freeShippingWon")}
                </p>
              )}

              <dl className="flex flex-col gap-2.5 border-t border-hairline px-4 py-4 text-[13px]">
                <SummaryRow
                  label={tc("subtotal", { count: totals.itemCount })}
                  value={money.format(totals.subtotal)}
                />
                {totals.discount > 0 && (
                  <SummaryRow
                    label={tc("discount", { code: draft.promo ?? "" })}
                    value={`-${money.format(totals.discount)}`}
                    tone="success"
                  />
                )}
                <SummaryRow
                  label={tc("shipping", {
                    method: tc(`methods.${draft.shipping.method}.short` as "methods.standard.short"),
                  })}
                  value={
                    totals.shipping === 0 ? tc("shippingFree") : money.format(totals.shipping)
                  }
                  tone={totals.shipping === 0 ? "success" : undefined}
                />
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
                  <dt className="text-[13px] font-semibold text-ink">{tc("total")}</dt>
                  <dd dir="ltr" className="display-cut text-[24px] leading-none num text-ink">
                    {money.format(totals.total)}
                  </dd>
                </div>
              </dl>

              <ul className="flex flex-col gap-2 border-t border-hairline bg-mist/50 px-4 py-3.5">
                {[t("assure.1"), t("assure.2"), t("assure.3")].map((line) => (
                  <li key={line} className="flex items-center gap-2 text-[11.5px] text-muted">
                    <ShieldCheck size={13} aria-hidden="true" className="shrink-0 text-mint-deep" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {!user ? (
              <Link
                href={`/${locale}/login?next=/checkout`}
                className="mt-3 flex items-center gap-2.5 rounded-soft border border-hairline bg-white px-3.5 py-3 text-[12.5px] text-ink shadow-soft transition-colors hover:border-brand/30"
              >
                <UserFocus size={16} aria-hidden="true" className="shrink-0 text-brand" />
                <span className="min-w-0">
                  {t("loginPrompt")}
                  <span className="ms-1 font-semibold text-brand underline underline-offset-4">
                    {t("loginHere")}
                  </span>
                </span>
              </Link>
            ) : (
              <p className="mt-3 flex items-start gap-2.5 px-1 text-[11.5px] leading-snug text-muted">
                <MapPin size={14} aria-hidden="true" className="mt-px shrink-0" />
                {t("savedAddressNote")}
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );

  function setError(field: string, error: FieldError | null) {
    setErrors((previous) => {
      const next = { ...previous };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  }
}

/** Which accordion is open is simply the draft's current step. */
function Step({
  index,
  openIndex,
  title,
  hint,
  summary,
  onEdit,
  children,
}: {
  index: number;
  openIndex: number;
  title: string;
  hint?: string;
  summary?: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("checkout");
  const open = index === openIndex;
  const completed = index < openIndex;
  const locked = index > openIndex;

  return (
    <section
      aria-labelledby={`step-${index}`}
      className={cn(
        "overflow-hidden rounded-sheet border bg-white transition-shadow",
        open
          ? "border-brand/20 shadow-pop"
          : locked
            ? "border-hairline bg-white/60 shadow-none"
            : "border-hairline shadow-soft",
      )}
    >
      <header className={cn("flex items-center gap-3 px-4 sm:px-5", open ? "py-4" : "py-3.5")}>
        <span
          aria-hidden="true"
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold num transition-colors",
            open
              ? "bg-brand text-white shadow-[0_6px_16px_-8px_rgba(47,107,255,0.9)]"
              : completed
                ? "bg-mint-soft text-mint-deep"
                : "bg-mist text-muted/70",
          )}
        >
          {completed ? <Check size={14} weight="bold" /> : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={`step-${index}`}
            className={cn(
              "text-[14.5px] font-semibold",
              locked ? "text-muted" : "text-ink",
            )}
          >
            {title}
          </h2>
          {open && hint && <p className="mt-0.5 text-[11.5px] text-muted">{hint}</p>}
        </div>
        {completed && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-hairline bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink transition-colors hover:border-brand/30 hover:text-brand"
          >
            {t("edit")}
          </button>
        )}
        {locked && (
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-muted/60"
          >
            <LockKey size={12} />
          </span>
        )}
      </header>

      {open ? (
        <div className="border-t border-hairline px-4 py-5 sm:px-5">{children}</div>
      ) : completed && summary ? (
        <p
          dir="ltr"
          className="flex items-center gap-2 truncate border-t border-hairline bg-mist/40 px-4 py-3 text-[12px] text-muted sm:px-5"
        >
          <Check size={12} weight="bold" aria-hidden="true" className="shrink-0 text-mint-deep" />
          {summary}
        </p>
      ) : null}
    </section>
  );
}

function SummaryRow({
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