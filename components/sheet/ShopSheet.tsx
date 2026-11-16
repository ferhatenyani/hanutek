"use client";

import {
  ArrowRight,
  Money,
  Check,
  CheckCircle,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CartPanel from "@/components/cart/CartPanel";
import Sheet from "@/components/ui/Sheet";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextInput, Textarea } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { flyToCart } from "@/components/products/useCardCart";
import { cartStore, cartTotals, useCartLines } from "@/lib/cart-store";
import {
  checkoutStore,
  maskPhone,
  useCheckout,
  useCheckoutStore,
  validateDraft,
  type ErrorMap,
} from "@/lib/checkout-store";
import { formatDA } from "@/lib/money";
import { EASE } from "@/lib/motion";
import { ordersStore, orderRef, useOrder } from "@/lib/orders-store";
import {
  highlightKeysOf,
  productById,
  specsOf,
  type Product,
} from "@/lib/products";
import { cn } from "@/lib/utils";

type Step =
  | { kind: "product"; id: string }
  | { kind: "cart" }
  | { kind: "checkout" }
  | { kind: "confirmation"; ref: string };

const ORDER: Step["kind"][] = ["product", "cart", "checkout", "confirmation"];

function parseStep(pathname: string, locale: string): Step | null {
  const rest = pathname.replace(new RegExp(`^/${locale}`), "");
  const product = /^\/product\/([^/]+)$/.exec(rest);
  if (product) return { kind: "product", id: product[1] };
  if (rest === "/cart") return { kind: "cart" };
  if (rest === "/checkout") return { kind: "checkout" };
  const order = /^\/order\/([^/]+)$/.exec(rest);
  if (order) return { kind: "confirmation", ref: order[1] };
  return null;
}

/**
 * The single persistent shopping surface. The URL chooses the step; steps
 * slide inside one already-open sheet, so product -> checkout never remounts
 * the sheet and the order can be confirmed without a second checkout click.
 */
export default function ShopSheet() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("cart");
  const tc = useTranslations("checkout");
  const tp = useTranslations("products");

  const step = useMemo(() => parseStep(pathname, locale), [pathname, locale]);
  const [held, setHeld] = useState<Step | null>(null);
  const [prevStep, setPrevStep] = useState<Step | null>(null);
  const [closing, setClosing] = useState(false);
  const [dir, setDir] = useState(1);

  // Follow the URL during render; hold the last step briefly so the sheet can
  // play its exit animation after the route leaves the shopping surface.
  if (step !== prevStep) {
    setPrevStep(step);
    if (step) {
      if (held) setDir(ORDER.indexOf(step.kind) >= ORDER.indexOf(held.kind) ? 1 : -1);
      setHeld(step);
      setClosing(false);
    } else if (held) {
      setClosing(true);
    }
  }

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => {
      setClosing(false);
      setHeld(null);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [closing]);

  const visible = step !== null || closing;
  const content = held;

  const cartLines = useCartLines();
  const totals = cartTotals({ lines: cartLines });
  const processing = useCheckoutStore((s) => s.processing);
  const product = content?.kind === "product" ? productById(content.id) : undefined;

  const title =
    content?.kind === "product"
      ? product
        ? tp(`items.${product.id}.title` as "items.p1.title")
        : tp("title")
      : content?.kind === "cart"
        ? t("title")
        : content?.kind === "checkout"
          ? tc("title")
          : tc("doneTitle");

  const eyebrow =
    content?.kind === "product"
      ? product?.brand
      : content?.kind === "cart"
        ? totals.itemCount > 0
          ? t("count", { count: totals.itemCount })
          : undefined
        : content?.kind === "confirmation"
          ? content.ref
          : undefined;

  const go = (path: string) => router.push(`/${locale}${path}`);

  const footer =
    content?.kind === "product" && product ? (
      <div className="grid grid-cols-2 gap-2.5 px-4 py-3.5 sm:px-5">
        <Button
          variant="outline"
          size="lg"
          disabled={!product.inStock}
          onClick={(event) => {
            cartStore.add(product.id, 1);
            flyToCart(event.currentTarget);
            go("/checkout");
          }}
        >
          {tp("addShort")}
        </Button>
        <Button
          size="lg"
          disabled={!product.inStock}
          trailing={<ArrowRight size={16} weight="bold" aria-hidden="true" className="rtl:rotate-180" />}
          onClick={(event) => {
            cartStore.add(product.id, 1);
            flyToCart(event.currentTarget);
            go("/checkout");
          }}
        >
          {tc("buyNow")}
        </Button>
      </div>
    ) : content?.kind === "cart" ? (
      totals.itemCount > 0 ? (
        <div className="px-4 py-3.5 sm:px-5">
          <Button
            size="xl"
            block
            trailing={<ArrowRight size={16} weight="bold" aria-hidden="true" className="rtl:rotate-180" />}
            onClick={() => go("/checkout")}
          >
            {t("checkout")} · {formatDA(totals.total, locale)}
          </Button>
        </div>
      ) : undefined
    ) : content?.kind === "checkout" ? (
      <div className="px-4 py-3.5 sm:px-5">
        <Button type="submit" form="cod-form" size="xl" block loading={processing}>
          {tc("confirm")} · {formatDA(totals.total, locale)}
        </Button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-muted">
          <Money size={11} aria-hidden="true" />
          {tc("codTag")}
        </p>
      </div>
    ) : content?.kind === "confirmation" ? (
      <div className="grid grid-cols-2 gap-2.5 px-4 py-3.5 sm:px-5">
        <ButtonLink href={`/${locale}/profile`} variant="outline" size="lg">
          {tc("track")}
        </ButtonLink>
        <ButtonLink href={`/${locale}`} size="lg">
          {tc("continue")}
        </ButtonLink>
      </div>
    ) : undefined;

  return (
    <AnimatePresence>
      {visible && content && (
        <Sheet
          key="shop-sheet"
          title={title}
          eyebrow={eyebrow}
          onClose={() => go("")}
          exiting={closing && step === null}
          footer={footer}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={content.kind + ("id" in content ? content.id : "ref" in content ? content.ref : "")}
              initial={{ y: dir * 72, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: dir * -72, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="px-4 pb-8 pt-2 sm:px-6 lg:px-10"
            >
              {content.kind === "product" &&
                (product ? (
                  <ProductStep product={product} />
                ) : (
                  <EmptyState
                    icon={<ShoppingBag size={27} weight="bold" />}
                    title={tp("noResults")}
                    body={tp("noResultsHint")}
                    action={tp("categories.all")}
                    actionHref={`/${locale}/products`}
                  />
                ))}
              {content.kind === "cart" && <CartPanel />}
              {content.kind === "checkout" && <CheckoutStep />}
              {content.kind === "confirmation" && <ConfirmationStep ref_={content.ref} />}
            </motion.div>
          </AnimatePresence>
        </Sheet>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */

function ProductStep({ product }: { product: Product }) {
  const tp = useTranslations("products");
  const t = useTranslations("product");
  const locale = useLocale();
  const description = t(`descriptions.${product.id}` as "descriptions.p1");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-8">
      {/* Media stays in view while the spec column scrolls on desktop. */}
      <div className="relative aspect-square w-full self-start overflow-hidden rounded-panel bg-mist lg:sticky lg:top-2 lg:aspect-[4/3]">
        <Image
          src={product.image}
          alt={tp(`items.${product.id}.title` as "items.p1.title")}
          fill
          sizes="(max-width: 1023px) 100vw, 640px"
          className="object-cover"
        />
        {!product.inStock && (
          <span className="absolute start-3 top-3 rounded-control bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
            {tp("soldOut")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span dir="ltr" className="display-cut num text-[26px] leading-none text-ink">
            {formatDA(product.price, locale)}
          </span>
          {product.oldPrice && (
            <span dir="ltr" className="num text-[14px] text-faint line-through">
              {formatDA(product.oldPrice, locale)}
            </span>
          )}
          <span
            className={cn(
              "rounded-control px-2 py-1 text-[10.5px] font-semibold",
              product.inStock ? "bg-success-soft text-success" : "bg-sale-soft text-sale",
            )}
          >
            {product.inStock ? t("inStock") : t("outOfStock")}
          </span>
        </div>

        <p className="text-[13.5px] leading-relaxed text-muted">{description}</p>

        <ul className="flex flex-col gap-2">
          {highlightKeysOf(product).map((key) => (
            <li key={key} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink">
              <Check size={15} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-success" />
              {t(`highlights.${product.id}.${key}` as "highlights.p1.guidelines")}
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line">
          {specsOf(product).map((row) => (
            <div key={row.labelKey} className="bg-white px-3.5 py-2.5">
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint rtl:tracking-normal">
                {t(`specs.${row.labelKey}` as "specs.resolution")}
              </dt>
              <dd dir="ltr" className="num mt-0.5 text-[13px] font-semibold text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CheckoutStep() {
  const t = useTranslations("checkout");
  const tp = useTranslations("products");
  const locale = useLocale();
  const router = useRouter();
  const draft = useCheckout();
  const lines = useCartLines();
  const totals = cartTotals({ lines });
  const [errors, setErrors] = useState<ErrorMap>({});
  const setProcessing = useCheckoutStore((s) => s.setProcessing);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0 || lines.length === 0) return;
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const ref = orderRef();
    ordersStore.place({
      ref,
      placedAt: new Date().toISOString(),
      status: "processing",
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      address: draft.address.trim(),
      lines: lines.map((l) => ({
        id: l.id,
        image: l.product.image,
        qty: l.qty,
        unitPrice: l.product.price,
      })),
      totals,
      payment: "cod",
    });
    cartStore.clear();
    setProcessing(false);
    router.push(`/${locale}/order/${ref}`);
  };

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={27} weight="bold" />}
        title={t("emptyTitle")}
        body={t("emptyBody")}
        action={t("emptyAction")}
        actionHref={`/${locale}/products`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Order summary — the cart content, already in the sheet. */}
      <section className="overflow-hidden rounded-panel border border-line bg-white">
        <ul className="divide-y divide-line">
          {lines.map((line) => (
            <li key={line.key} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-control bg-mist">
                <Image src={line.product.image} alt="" fill sizes="44px" className="object-cover" />
                <span
                  dir="ltr"
                  className="num absolute -end-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold text-white ring-2 ring-white"
                >
                  {line.qty}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                {tp(`items.${line.id}.title` as "items.p1.title")}
              </span>
              <span dir="ltr" className="num shrink-0 text-[12.5px] font-semibold text-ink">
                {formatDA(line.lineTotal, locale)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between gap-3 border-t border-line bg-mist px-3.5 py-3">
          <p className="text-[12.5px] font-semibold text-ink">{t("total")}</p>
          <p dir="ltr" className="display-cut num text-[20px] leading-none text-ink">
            {formatDA(totals.total, locale)}
          </p>
        </div>
      </section>

      <form id="cod-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextInput
          id="cod-name"
          label={t("name")}
          value={draft.name}
          onChange={(name) => checkoutStore.patch({ name })}
          error={errors.name ? t(`errors.${errors.name.code}` as "errors.required") : undefined}
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          enterKeyHint="next"
        />
        <TextInput
          id="cod-phone"
          label={t("phone")}
          value={draft.phone}
          onChange={(phone) => checkoutStore.patch({ phone: maskPhone(phone) })}
          error={errors.phone ? t(`errors.${errors.phone.code}` as "errors.required") : undefined}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="05 60 12 34 56"
          enterKeyHint="next"
        />
        <Textarea
          id="cod-address"
          label={t("address")}
          value={draft.address}
          onChange={(address) => checkoutStore.patch({ address })}
          hint={t("addressHint")}
          rows={3}
          placeholder={t("addressPlaceholder")}
        />
        {errors.address && (
          <p role="alert" className="-mt-2 text-[12px] font-medium text-sale">
            {t(`errors.${errors.address.code}` as "errors.required")}
          </p>
        )}
      </form>

      <p className="flex items-center gap-2.5 rounded-panel border border-line bg-mist px-3.5 py-3 text-[12.5px] font-medium text-muted">
        <Money size={16} aria-hidden="true" className="shrink-0 text-ink" />
        {t("codNote")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ConfirmationStep({ ref_ }: { ref_: string }) {
  const t = useTranslations("checkout");
  const tp = useTranslations("products");
  const locale = useLocale();
  const order = useOrder(ref_);

  if (!order) {
    return (
      <EmptyState
        icon={<ShoppingBag size={27} weight="bold" />}
        title={t("notFoundTitle")}
        body={t("notFoundBody")}
        action={t("continue")}
        actionHref={`/${locale}`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-panel border border-success/25 bg-success-soft px-5 py-7 text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white"
        >
          <CheckCircle size={30} weight="fill" aria-hidden="true" />
        </motion.span>
        <h3 className="display-cut text-[20px] text-ink">{t("doneTitle")}</h3>
        <p className="max-w-[36ch] text-[13px] leading-relaxed text-muted">{t("doneBody")}</p>
        <p dir="ltr" className="num rounded-control bg-white px-3 py-1.5 text-[13px] font-bold text-ink ring-1 ring-inset ring-success/25">
          {order.ref}
        </p>
      </div>

      <section className="overflow-hidden rounded-panel border border-line bg-white">
        <ul className="divide-y divide-line">
          {order.lines.map((line) => (
            <li key={line.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-control bg-mist">
                <Image src={line.image} alt="" fill sizes="44px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                {tp(`items.${line.id}.title` as "items.p1.title")} × {line.qty}
              </span>
              <span dir="ltr" className="num shrink-0 text-[12.5px] font-semibold text-ink">
                {formatDA(line.unitPrice * line.qty, locale)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between gap-3 border-t border-line bg-mist px-3.5 py-3">
          <p className="text-[12.5px] font-semibold text-ink">{t("total")}</p>
          <p dir="ltr" className="display-cut num text-[20px] leading-none text-ink">
            {formatDA(order.totals.total, locale)}
          </p>
        </div>
      </section>

      <ul className="flex flex-col gap-2.5 rounded-panel border border-line bg-white px-4 py-3.5 text-[12.5px] text-muted">
        <li className="flex items-start gap-2.5">
          <User size={15} aria-hidden="true" className="mt-px shrink-0 text-ink" />
          {order.name}
        </li>
        <li className="flex items-start gap-2.5">
          <Phone size={15} aria-hidden="true" className="mt-px shrink-0 text-ink" />
          <span dir="ltr">{order.phone}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <MapPin size={15} aria-hidden="true" className="mt-px shrink-0 text-ink" />
          {order.address}
        </li>
        <li className="flex items-start gap-2.5 border-t border-line pt-2.5 font-medium text-ink">
          <Money size={15} aria-hidden="true" className="mt-px shrink-0 text-success" />
          {t("codReminder", { total: formatDA(order.totals.total, locale) })}
        </li>
      </ul>

      <p className={cn("flex items-center justify-center gap-1.5 text-[11px] text-muted")}>
        <ShieldCheck size={12} aria-hidden="true" />
        {t("doneNote")}
      </p>
    </div>
  );
}